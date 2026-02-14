import os
import sys
from dotenv import load_dotenv
import ollama
import pymongo

load_dotenv()

# ---------------- CONFIG ----------------
MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("NAUKRI_DB_NAME", "job_portal")
COLLECTION_NAME = os.getenv("NAUKRI_COLLECTION_NAME", "jobs")

EMBED_MODEL = os.getenv("MODEL_NAME", "qwen3-embedding:0.6b")
CHAT_MODEL = "granite4"

TOP_K = 5
MIN_SCORE = 0.6

# ---------------- DB CONNECTION ----------------
try:
    client = pymongo.MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    client.admin.command("ping")
    collection = client[DB_NAME][COLLECTION_NAME]
    print(f" Connected to MongoDB: {DB_NAME}")
except Exception as e:
    print(f" MongoDB Connection Error: {e}")
    sys.exit(1)

# ---------------- RAG: CONTEXT BUILDER ----------------
def build_context(docs):
    """
    Converts retrieved MongoDB documents into LLM-friendly context.
    """
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

# ---------------- RAG: GENERATION ----------------
def generate_answer(question, context):
    """
    Generates grounded answers using retrieved context.
    """
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

# ---------------- MAIN RAG PIPELINE ----------------
def rag_pipeline(user_query):
    print(f"\nSearching for: {user_query}")

    # 1️. Embed the query
    query_embedding = ollama.embeddings(
        model=EMBED_MODEL,
        prompt=user_query
    )["embedding"]

    # 2️. Vector search
    pipeline = [
        {
            "$vectorSearch": {
                "index": "naukri_job_vector_index",
                "path": "job_embedding",  
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

    results = list(collection.aggregate(pipeline))

    if not results:
        return "No relevant job data found for your question.", []

    # 3️. Build context
    context = build_context(results)

    # 4️. Generate grounded answer
    answer = generate_answer(user_query, context)

    return answer, results

# ---------------- RUN ----------------
if __name__ == "__main__":
    user_question = input("\nAsk a question about jobs: ")

    try:
        answer, sources = rag_pipeline(user_question)

        print("\n" + "=" * 60)
        print(" AI ASSISTANT ANSWER:\n")
        print(answer)
        print("=" * 60)

        # print("\n Sources:")
        # for src in sources:
        #     print(f"- {src['company']} | {src['job_title']} (Score: {src.get('score', 0):.3f})")

    except Exception as e:
        print(f" Error occurred: {e}")
