import os
import sys
from dotenv import load_dotenv
import ollama
import pymongo

# --------------------------------------------------
# LOAD ENV
# --------------------------------------------------
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME", "foundit_records")
COLLECTION_NAME = os.getenv("COLLECTION_NAME", "jobs")

EMBED_MODEL = os.getenv("MODEL_NAME", "qwen3-embedding:0.6b")
CHAT_MODEL = "granite4"

VECTOR_INDEX = "vector_index"
VECTOR_PATH = "skills_embedding"   # 🔁 CHANGE LATER TO combined_embedding

TOP_K = 5
MIN_SCORE = 0.8
MAX_CONTEXT_CHARS = 3500

# --------------------------------------------------
# DB CONNECTION
# --------------------------------------------------
try:
    client = pymongo.MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    client.admin.command("ping")
    collection = client[DB_NAME][COLLECTION_NAME]
    print(f"✅ Connected to database: {DB_NAME}")
except Exception as e:
    print(f"❌ Database connection failed: {e}")
    sys.exit(1)

# --------------------------------------------------
# STEP 0: QUERY VALIDATION
# --------------------------------------------------
def validate_query(query: str) -> bool:
    return bool(query and len(query.strip()) >= 3)

# --------------------------------------------------
# STEP 1: EMBED QUERY
# --------------------------------------------------
def embed_query(query: str):
    return ollama.embeddings(
        model=EMBED_MODEL,
        prompt=query
    )["embedding"]

# --------------------------------------------------
# STEP 2: VECTOR RETRIEVAL
# --------------------------------------------------
def retrieve_documents(query_embedding):
    pipeline = [
        {
            "$vectorSearch": {
                "index": VECTOR_INDEX,
                "path": VECTOR_PATH,
                "queryVector": query_embedding,
                "numCandidates": 20,
                "limit": TOP_K
            }
        },
        {
            "$project": {
                "_id": 0,
                "company": 1,
                "job_title": 1,
                "location": 1,
                "skills_required": 1,
                "job_description_summary": 1,
                "job_url": 1,
                "score": {"$meta": "vectorSearchScore"}
            }
        },
        {
            "$match": {
                "score": {"$gte": MIN_SCORE}
            }
        }
    ]

    return list(collection.aggregate(pipeline))

# --------------------------------------------------
# STEP 3: BUILD CONTEXT
# --------------------------------------------------
def build_context(docs):
    context = ""
    for i, doc in enumerate(docs, start=1):
        context += f"""
--- Job {i} ---
Company: {doc.get('company', 'N/A')}
Job Title: {doc.get('job_title', 'N/A')}
Location: {doc.get('location', 'N/A')}
Skills Required: {', '.join(doc.get('skills_required', []))}
Summary: {doc.get('job_description_summary', 'N/A')}
"""
    return context.strip()

# --------------------------------------------------
# STEP 3.5: CONTEXT SIZE CONTROL
# --------------------------------------------------
def trim_context(context: str):
    return context[:MAX_CONTEXT_CHARS]

# --------------------------------------------------
# STEP 4: GENERATION
# --------------------------------------------------
def generate_answer(question: str, context: str):
    system_prompt = (
        "You are a professional Job & Career Assistant.\n"
        "Answer ONLY using the provided job context.\n"
        "If the answer is not present in the context, say so clearly.\n"
        "Be concise, factual, and professional."
    )

    user_prompt = f"""
User Question:
{question}

Relevant Job Context:
{context}
"""

    response = ollama.generate(
        model=CHAT_MODEL,
        system=system_prompt,
        prompt=user_prompt
    )

    return response["response"]

# --------------------------------------------------
# COMPLETE RAG PIPELINE
# --------------------------------------------------
def rag_pipeline(user_query: str):

    # Step 0: Validate query
    if not validate_query(user_query):
        return "❌ Please ask a meaningful job-related question.", []

    print(f"\n🔍 Searching Foundit for: {user_query}")

    # Step 1: Embed query
    query_embedding = embed_query(user_query)

    # Step 2: Retrieve documents
    docs = retrieve_documents(query_embedding)

    if not docs:
        return "❌ No relevant Foundit jobs found.", []

    # Step 3: Build context
    context = build_context(docs)

    # Step 3.5: Trim context
    context = trim_context(context)

    # Step 4: Generate answer
    answer = generate_answer(user_query, context)

    return answer, docs

# --------------------------------------------------
# RUN
# --------------------------------------------------
if __name__ == "__main__":

    user_question = input("\nAsk a question about Foundit jobs: ")

    try:
        answer, sources = rag_pipeline(user_question)

        print("\n" + "=" * 60)
        print("🤖 AI ASSISTANT ANSWER:\n")
        print(answer)
        print("=" * 60)

        print("\n📌 Sources:")
        for src in sources:
            print(
                f"- {src['company']} | {src['job_title']} "
                f"(Score: {src.get('score', 0):.3f})\n"
                f"  Link: {src.get('job_url', 'N/A')}"
            )

    except Exception as e:
        print(f"❌ Error occurred: {e}")
