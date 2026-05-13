import os
import uuid
from typing import TypedDict, Literal, List, Optional
from dotenv import load_dotenv
# pyrefly: ignore [missing-import]
from langchain_groq import ChatGroq
from langchain_core.output_parsers import StrOutputParser
from langgraph.graph import StateGraph, START, END

from pymongo import MongoClient
from pydantic import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_ollama import OllamaEmbeddings
from langchain_mongodb import MongoDBAtlasVectorSearch


load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME", "job_records")
COLLECTION_NAME = os.getenv("COLLECTION_NAME", "jobs")

EMBED_MODEL = os.getenv("MODEL_NAME", "qwen3-embedding:0.6b")
CHAT_MODEL = "llama-3.3-70b-versatile"

TOP_K = 10
MIN_SCORE = 0.75
MAX_CONTEXT_CHARS = 5000
MAX_DOC_RETRIES = 2          # max times to rewrite query when no docs are found
MAX_HALLUCINATION_RETRIES = 1 # max times to retry generation on hallucination

print(f"Using embedding model: {EMBED_MODEL}")

embeddings = OllamaEmbeddings(model=EMBED_MODEL)
client = MongoClient(MONGO_URI)
collection = client[DB_NAME][COLLECTION_NAME]

vector_store = MongoDBAtlasVectorSearch(
    collection=collection,
    embedding=embeddings,
    index_name="vector_index",
    text_key="job_description_summary",
    embedding_key="job_embedding",
)

retriever = vector_store.as_retriever(
    search_type="similarity_score_threshold",
    search_kwargs={"k": TOP_K, "score_threshold": MIN_SCORE},
)


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class RouteQuery(BaseModel):
    """Route the user query to the most relevant datasource based on topic."""

    datasource: Literal["vectorstore", "web_search", "off_topic"] = Field(
        ...,
        description=(
            "Choose 'vectorstore' for questions about companies, job roles, skills, "
            "or placements. Choose 'web_search' for general career/job knowledge not "
            "in the internal database. Choose 'off_topic' for greetings, chitchat, "
            "or topics completely unrelated to jobs, recruitment, or career advice."
        ),
    )


class GradeDocuments(BaseModel):
    """Binary score for relevance check on retrieved documents."""

    binary_score: str = Field(
        description="Relevance score: 'yes' if the document is useful for answering the question, 'no' if not."
    )


class GradeHallucination(BaseModel):
    """Binary score for hallucination check."""

    binary_score: str = Field(
        description="Answer is grounded in the facts, 'yes' or 'no'"
    )


class GradeAnswer(BaseModel):
    """Binary score to assess whether the answer addresses the question."""

    binary_score: str = Field(description="Answer addresses the question, 'yes' or 'no'")


# ---------------------------------------------------------------------------
# LLM & Chains
# ---------------------------------------------------------------------------

llm = ChatGroq(model=CHAT_MODEL, temperature=0)

# --- Router ---
structured_llm_router = llm.with_structured_output(RouteQuery)

route_system = """You are an expert recruitment and career-path router.
Your ONLY job is to classify the user query into one of three categories.

VECTORSTORE — use when the question is explicitly about:
  • Specific companies (e.g. "What does Accenture look for?")
  • Job roles, titles, or designations (e.g. "Data Analyst at TCS")
  • Skills required for a particular role or company
  • Placements, internships, campus hiring, or hiring processes
  • Salary/CTC, experience requirements, or job locations

WEB_SEARCH — use when the question is job/career-related but too general for
  the internal database, such as:
  • "How do I prepare for a system design interview?"
  • "What is the average salary for ML engineers in 2025?"
  • Broad career advice or industry trends

OFF_TOPIC — use for EVERYTHING else:
  • Greetings: "hi", "hello", "how are you", "thanks"
  • Chitchat or personal conversation
  • Non-career topics: weather, sports, politics, coding help, etc.
  • Any query that has NO connection to jobs, recruitment, or career growth

RULE: When in doubt between vectorstore and web_search, prefer vectorstore.
RULE: Greetings and casual messages MUST always be 'off_topic'."""

route_prompt = ChatPromptTemplate.from_messages(
    [("system", route_system), ("human", "{question}")]
)
question_router = route_prompt | structured_llm_router

# --- Document Grader ---
structured_llm_doc_grader = llm.with_structured_output(GradeDocuments)

doc_grade_system = """You are a grader assessing relevance of a retrieved document to a user question.

Relevance Criteria:
- The document contains keywords or semantic concepts related to the question.
- The document provides information that could help formulate an answer.
- It does NOT need to be a complete answer to be considered 'yes'.
- If the document is completely unrelated, score it as 'no'."""

grade_prompt = ChatPromptTemplate.from_messages(
    [
        ("system", doc_grade_system),
        ("human", "Retrieved document:\n\n{document}\n\nUser question: {question}"),
    ]
)
retrieval_grader = grade_prompt | structured_llm_doc_grader

# --- RAG Chain ---
rag_template = """You are an expert assistant for job and recruitment question-answering tasks.
Use the following pieces of retrieved context to answer the question.

---
CONTEXT:
{context}
---

INSTRUCTIONS:
1. If the answer is not contained within the context, clearly state that you do not know.
2. Do not attempt to make up an answer or use outside knowledge.
3. Keep the answer concise (3-5 sentences) and professional.
4. Use bullet points when listing skills, requirements, or multiple items.

QUESTION:
{question}

HELPFUL ANSWER:"""

rag_prompt = ChatPromptTemplate.from_template(rag_template)
rag_chain = rag_prompt | llm | StrOutputParser()

# --- Query Transformer (IMPROVED) ---
# Strategy: structured entity extraction → targeted query reconstruction.
# This dramatically improves retrieval accuracy by producing precise, metadata-aware queries.
transform_system = """You are an expert at optimizing search queries for a MongoDB Atlas Vector Search
database that contains job postings with the following fields:
  - company (e.g., "Infosys", "Google", "Morgan Stanley")
  - job_title (e.g., "Software Engineer", "Data Analyst")
  - skills_required (e.g., "Python, SQL, Machine Learning")
  - location (e.g., "Bangalore", "Remote")
  - job_description_summary

Your task is to rewrite the user's question into an OPTIMAL retrieval query by following these steps:

STEP 1 — Entity Extraction:
  Identify: Company | Role/Title | Skills | Location | Intent (skills/process/salary/requirements)

STEP 2 — Query Reconstruction:
  • Keep any company name EXACTLY as written (do not paraphrase).
  • Expand role synonyms (e.g., "dev" → "Software Developer Engineer").
  • Include the specific domain or tech stack if implied (e.g., "banking role" → "Finance Analyst Investment Banking").
  • Append the primary intent keyword: "skills required", "hiring process", "job requirements", "eligibility criteria".
  • Drop filler words like "what", "tell me", "I want to know".

STEP 3 — Output:
  Return ONLY the final optimized query string. No explanation. No punctuation at the end.

EXAMPLES:
  Input:  "What skills does TCS need?"
  Output: TCS Tata Consultancy Services job skills required technical stack eligibility

  Input:  "How does Amazon hire freshers?"
  Output: Amazon fresher hiring process recruitment criteria campus placement requirements

  Input:  "Python jobs in Bangalore"
  Output: Python developer software engineer Bangalore job requirements skills

  Input:  "What does Morgan Stanley look for in analysts?"
  Output: Morgan Stanley analyst job requirements skills eligibility finance investment banking"""

re_write_prompt = ChatPromptTemplate.from_messages(
    [
        ("system", transform_system),
        ("human", "User Question: {question}\n\nOptimized Search Query:"),
    ]
)
question_rewriter = re_write_prompt | llm | StrOutputParser()

# --- Hallucination Grader ---
structured_llm_hallucination_grader = llm.with_structured_output(GradeHallucination)

hallucination_system = """You are a grader assessing whether an LLM generation is grounded in
a set of retrieved facts. Give a binary score 'yes' or 'no'.
'yes' means the generation is supported by the facts.
Be lenient with phrasing — as long as the factual claim exists in the source, it is 'yes'."""

hallucination_prompt = ChatPromptTemplate.from_messages(
    [
        ("system", hallucination_system),
        ("human", "Set of facts:\n\n{documents}\n\nLLM Generation: {generation}"),
    ]
)
hallucination_grader = hallucination_prompt | structured_llm_hallucination_grader

# --- Answer Grader ---
structured_llm_answer_grader = llm.with_structured_output(GradeAnswer)

answer_system = """You are a grader assessing whether an answer resolves a question.
Give a binary score 'yes' or 'no'. 'yes' means the answer resolves the question.
Be lenient with phrasing."""

answer_prompt = ChatPromptTemplate.from_messages(
    [
        ("system", answer_system),
        ("human", "User Question:\n\n{question}\n\nLLM Generation: {generation}"),
    ]
)
answer_grader = answer_prompt | structured_llm_answer_grader

web_search_tool = TavilySearchResults(k=3)


# ---------------------------------------------------------------------------
# Graph State
# ---------------------------------------------------------------------------

class GraphState(TypedDict):
    """
    Represents the state of the RAG graph.

    Attributes:
        question:              Current (possibly rewritten) question
        original_question:     The original user question (preserved for answer grading)
        generation:            LLM generation
        documents:             Flat text context string passed to LLM
        source_docs:           Raw Document objects from retriever
        web_docs:              Raw Tavily result dicts
        path:                  "vectorstore" | "web_search" — tracks which route was taken
                               so transform_query can re-route to the correct node
        retries:               Number of query rewrites due to missing/irrelevant docs
        hallucination_retries: Number of generation retries due to hallucination
    """

    question: str
    original_question: str
    generation: str
    documents: str
    source_docs: List
    web_docs: List
    path: str
    retries: int
    hallucination_retries: int
    next_step: str


# ---------------------------------------------------------------------------
# Nodes
# ---------------------------------------------------------------------------

def retrieve(state: GraphState) -> dict:
    """Retrieve documents from the vector store."""
    print("---RETRIEVE NODE---")
    question = state["question"]

    docs = retriever.invoke(question)

    context = "\n\n".join(
        [
            f"Company: {doc.metadata.get('company')}\n"
            f"Title: {doc.metadata.get('job_title')}\n"
            f"Skills: {doc.metadata.get('skills_required')}\n"
            f"Location: {doc.metadata.get('location')}\n"
            f"Job URL: {doc.metadata.get('job_url')}\n"
            f"Description: {doc.page_content}"
            for doc in docs
        ]
    )
    return {"documents": context, "source_docs": docs, "question": question, "path": "vectorstore"}


def generate(state: GraphState) -> dict:
    """Generate an answer using RAG."""
    print("---GENERATE NODE---")
    question = state["question"]
    context = state["documents"]

    generation = rag_chain.invoke({"context": context, "question": question})
    return {"generation": generation}


def grade_documents(state: GraphState) -> dict:
    """Filter retrieved documents to only those relevant to the question."""
    print("---GRADE DOCUMENTS NODE---")
    question = state["question"]
    source_docs = state.get("source_docs", [])

    filtered_docs = []
    for doc in source_docs:
        doc_text = (
            f"Company: {doc.metadata.get('company')}\n"
            f"Title: {doc.metadata.get('job_title')}\n"
            f"Skills: {doc.metadata.get('skills_required')}\n"
            f"Description: {doc.page_content}"
        )
        score = retrieval_grader.invoke({"question": question, "document": doc_text})
        if score.binary_score == "yes":
            print("  ✓ Relevant document kept")
            filtered_docs.append(doc)
        else:
            print("  ✗ Irrelevant document dropped")

    # Rebuild context string from filtered docs
    context = "\n\n".join(
        f"Company: {doc.metadata.get('company')}\n"
        f"Title: {doc.metadata.get('job_title')}\n"
        f"Skills: {doc.metadata.get('skills_required')}\n"
        f"Location: {doc.metadata.get('location')}\n"
        f"Job URL: {doc.metadata.get('job_url')}\n"
        f"Description: {doc.page_content}"
        for doc in filtered_docs
    )
    return {"documents": context, "source_docs": filtered_docs, "question": question}


def transform_query(state: GraphState) -> dict:
    """
    Rewrite the question into an optimised retrieval query.
    Increments the retry counter and preserves the original question
    for final answer grading.
    """
    print("---TRANSFORM QUERY NODE---")
    question = state["question"]
    retries = state.get("retries", 0) + 1

    better_question = question_rewriter.invoke({"question": question})
    print(f"  Original : {question}")
    print(f"  Rewritten: {better_question}")

    return {
        "question": better_question,
        "retries": retries,
    }


def web_search(state: GraphState) -> dict:
    """Perform a web search and store results."""
    print("---WEB SEARCH NODE---")
    question = state["question"]

    docs = web_search_tool.invoke({"query": question})
    web_results = "\n".join([d["content"] for d in docs])

    return {"documents": web_results, "web_docs": docs, "question": question, "path": "web_search"}


def off_topic_response(state: GraphState) -> dict:
    """
    Return a polite, single-message response for queries unrelated to jobs/recruitment.
    This node terminates immediately — no retrieval or generation needed.
    """
    print("---OFF-TOPIC NODE---")
    msg = (
        "I'm a job and recruitment assistant, so I can only help with questions about "
        "companies, job roles, required skills, hiring processes, placements, and career "
        "guidance. Please ask me something along those lines and I'll be happy to help!"
    )
    return {"generation": msg}


# ---------------------------------------------------------------------------
# Conditional Edges
# ---------------------------------------------------------------------------

def route_question(state: GraphState) -> str:
    """
    Route the question to vectorstore, web search, or off-topic handler.
    Note: path is set in the destination nodes (retrieve, web_search),
    not here, because LangGraph conditional edges cannot mutate state.
    """
    print("---ROUTING QUESTION---")
    question = state["question"]
    source = question_router.invoke({"question": question})

    if source.datasource == "off_topic":
        print("---ROUTE: OFF-TOPIC---")
        return "off_topic"

    if source.datasource == "web_search":
        print("---ROUTE: WEB SEARCH---")
        return "web_search"

    print("---ROUTE: VECTORSTORE---")
    return "vectorstore"


def decide_to_generate(state: GraphState) -> str:
    """
    After document grading, decide whether to generate or rewrite the query.

    Guard rails:
      • If no relevant docs were found AND retries < MAX_DOC_RETRIES → rewrite.
      • If no relevant docs AND retries >= MAX_DOC_RETRIES → force generate
        (the RAG chain will say it doesn't know, which is honest).
      • If there are relevant docs → generate.
    """
    print("---ASSESS GRADED DOCUMENTS---")
    filtered_documents = state.get("documents", "").strip()
    retries = state.get("retries", 0)

    if not filtered_documents:
        if retries >= MAX_DOC_RETRIES:
            print(f"---DECISION: MAX RETRIES ({MAX_DOC_RETRIES}) REACHED — FORCING GENERATE---")
            return "generate"
        print("---DECISION: NO RELEVANT DOCS — REWRITING QUERY---")
        return "transform_query"

    print("---DECISION: RELEVANT DOCS FOUND — GENERATING---")
    return "generate"


def check_generation(state: GraphState) -> dict:
    """
    Node that checks for hallucinations and answer relevance.
    Returns state updates including the routing decision in 'next_step'.

    This is a NODE (not a conditional edge) so that state mutations
    like incrementing hallucination_retries are properly persisted.

    Uses original_question for answer-grading so a rewritten query
    doesn't cause a false "not useful" verdict.
    """
    print("---CHECK HALLUCINATIONS---")
    question = state.get("original_question") or state["question"]
    documents = state["documents"]
    generation = state["generation"]
    hallucination_retries = state.get("hallucination_retries", 0)
    path = state.get("path", "vectorstore")

    # Hard guard — never loop more than MAX_HALLUCINATION_RETRIES times
    if hallucination_retries >= MAX_HALLUCINATION_RETRIES:
        print(f"---DECISION: MAX HALLUCINATION RETRIES REACHED — ENDING---")
        return {"next_step": "useful"}

    score = hallucination_grader.invoke({"documents": documents, "generation": generation})

    if score.binary_score == "yes":
        print("---DECISION: GENERATION GROUNDED IN DOCUMENTS---")
        score2 = answer_grader.invoke({"question": question, "generation": generation})
        if score2.binary_score == "yes":
            print("---DECISION: GENERATION ADDRESSES QUESTION---")
            return {"next_step": "useful"}
        else:
            print("---DECISION: GENERATION DOES NOT ADDRESS QUESTION — RETRYING---")
            return {
                "hallucination_retries": hallucination_retries + 1,
                "next_step": f"retry_{path}",
            }
    else:
        print("---DECISION: HALLUCINATION DETECTED — RETRYING---")
        return {
            "hallucination_retries": hallucination_retries + 1,
            "next_step": f"retry_{path}",
        }


def route_after_generation(state: GraphState) -> str:
    """Simple conditional edge that reads the routing decision set by check_generation."""
    return state.get("next_step", "useful")


# ---------------------------------------------------------------------------
# Graph Assembly
# ---------------------------------------------------------------------------

workflow = StateGraph(GraphState)

# Nodes
workflow.add_node("off_topic_response", off_topic_response)
workflow.add_node("web_search", web_search)
workflow.add_node("retrieve", retrieve)
workflow.add_node("grade_documents", grade_documents)
workflow.add_node("generate", generate)
workflow.add_node("transform_query", transform_query)
workflow.add_node("check_generation", check_generation)

# --- Entry routing ---
# Vectorstore queries go through transform_query FIRST for optimised retrieval.
# Raw user questions produce poor embeddings; the rewriter converts them into
# keyword-rich queries that match the vector store much better.
workflow.add_conditional_edges(
    START,
    route_question,
    {
        "off_topic": "off_topic_response",
        "web_search": "web_search",
        "vectorstore": "transform_query",
    },
)

# --- Off-topic short-circuits to END ---
workflow.add_edge("off_topic_response", END)

# --- Web search path ---
workflow.add_edge("web_search", "generate")

# --- Vectorstore path ---
workflow.add_edge("transform_query", "retrieve")
workflow.add_edge("retrieve", "grade_documents")
workflow.add_conditional_edges(
    "grade_documents",
    decide_to_generate,
    {
        "transform_query": "transform_query",
        "generate": "generate",
    },
)

# --- Generation quality check (node-based to properly persist state) ---
# check_generation is a NODE that sets next_step + increments hallucination_retries.
# route_after_generation is a thin conditional edge that reads next_step.
workflow.add_edge("generate", "check_generation")
workflow.add_conditional_edges(
    "check_generation",
    route_after_generation,
    {
        "useful": END,
        "retry_vectorstore": "transform_query",
        "retry_web_search": "web_search",
    },
)

# Compile
app = workflow.compile()


# ---------------------------------------------------------------------------
# Session management & public API used by chat.py
# ---------------------------------------------------------------------------

CHAT_SESSIONS_COLLECTION = "chat_sessions"


def _get_sessions_collection():
    return client[DB_NAME][CHAT_SESSIONS_COLLECTION]


def create_session(userId: str) -> tuple[str, str]:
    import datetime

    session_id = str(uuid.uuid4())
    doc = {
        "session_id": session_id,
        "userId": userId,
        "title": "New Chat",
        "created_at": datetime.datetime.utcnow(),
        "messages": [],
    }
    _get_sessions_collection().insert_one(doc)
    return session_id, session_id  # thread_id == session_id


def get_or_create_thread(session_id: str, userId: str) -> str:
    existing = _get_sessions_collection().find_one(
        {"session_id": session_id, "userId": userId}
    )
    if existing:
        return session_id

    import datetime

    doc = {
        "session_id": session_id,
        "userId": userId,
        "title": "New Chat",
        "created_at": datetime.datetime.utcnow(),
        "messages": [],
    }
    _get_sessions_collection().insert_one(doc)
    return session_id


def list_sessions(userId: str) -> list[dict]:
    import datetime

    sessions = []
    for doc in _get_sessions_collection().find({"userId": userId}).sort("created_at", -1):
        created_at = doc.get("created_at")
        if isinstance(created_at, datetime.datetime):
            created_at = created_at.isoformat()
        elif created_at is None and "_id" in doc:
            created_at = doc["_id"].generation_time.isoformat()

        sessions.append(
            {
                "session_id": doc["session_id"],
                "title": doc.get("title", "New Chat"),
                "created_at": created_at,
                "message_count": len(doc.get("messages", [])),
            }
        )
    return sessions


def get_session(session_id: str, userId: str) -> dict | None:
    import datetime

    doc = _get_sessions_collection().find_one(
        {"session_id": session_id, "userId": userId}
    )
    if not doc:
        return None

    created_at = doc.get("created_at")
    if isinstance(created_at, datetime.datetime):
        created_at = created_at.isoformat()

    formatted_messages = []
    for msg in doc.get("messages", []):
        msg_copy = dict(msg)
        ts = msg_copy.get("created_at")
        if isinstance(ts, datetime.datetime):
            msg_copy["created_at"] = ts.isoformat()
        formatted_messages.append(msg_copy)

    return {
        "session_id": doc["session_id"],
        "title": doc.get("title", "New Chat"),
        "created_at": created_at,
        "messages": formatted_messages,
    }


def update_session_title(session_id: str, title: str, userId: str) -> bool:
    result = _get_sessions_collection().update_one(
        {"session_id": session_id, "userId": userId}, {"$set": {"title": title}}
    )
    return result.modified_count > 0


def delete_session(session_id: str, userId: str) -> bool:
    result = _get_sessions_collection().delete_one(
        {"session_id": session_id, "userId": userId}
    )
    return result.deleted_count > 0


def add_message_to_session(session_id: str, role: str, content: str, userId: str):
    import datetime

    _get_sessions_collection().update_one(
        {"session_id": session_id, "userId": userId},
        {
            "$push": {
                "messages": {
                    "role": role,
                    "content": content,
                    "created_at": datetime.datetime.utcnow().isoformat(),
                }
            }
        },
    )


def run_agent(
    thread_id: str,
    message: str,
    session_id: str | None = None,
    userId: str | None = None,
) -> dict:
    """
    Invoke the RAG graph for a single question and return:
        {
            "reply":       str,
            "sources":     list[dict],   # vector-store sources
            "web_sources": list[dict],   # web-search sources (if used)
        }
    """
    inputs: GraphState = {
        "question": message,
        "original_question": message,   # preserved for final answer grading
        "generation": "",
        "documents": "",
        "source_docs": [],
        "web_docs": [],
        "path": "vectorstore",          # default; overwritten by retrieve/web_search nodes
        "retries": 0,
        "hallucination_retries": 0,
        "next_step": "",                # routing decision from check_generation
    }
    result = app.invoke(inputs)

    generation = result.get("generation", "")
    raw_source_docs = result.get("source_docs", [])

    # --- Vector-store sources ---
    sources: list[dict] = []
    for doc in raw_source_docs:
        m = doc.metadata
        skills_raw = m.get("skills_required", [])
        if isinstance(skills_raw, str):
            skills_list = [s.strip() for s in skills_raw.split(",") if s.strip()]
        else:
            skills_list = list(skills_raw) if skills_raw else []

        sources.append(
            {
                "job_title": m.get("job_title"),
                "company": m.get("company"),
                "location": m.get("location"),
                "job_url": m.get("job_url"),
                "skills_required": skills_list,
                "job_description_summary": doc.page_content[:300] if doc.page_content else None,
                "experience": m.get("experience"),
                "salary": m.get("salary"),
                "employment_type": m.get("employment_type"),
            }
        )

    # --- Web sources ---
    web_sources: list[dict] = []
    raw_web_docs = result.get("web_docs", [])
    if raw_web_docs:
        first = raw_web_docs[0]
        web_sources = [
            {
                "title": first.get("title") or first.get("url", "Web Result"),
                "url": first.get("url"),
                "content": first.get("content", "")[:400],
            }
        ]

    # Persist to MongoDB if session info provided
    if session_id and userId:
        add_message_to_session(session_id, "user", message, userId)
        add_message_to_session(session_id, "assistant", generation, userId)

    return {
        "reply": generation,
        "sources": sources,
        "web_sources": web_sources,
    }