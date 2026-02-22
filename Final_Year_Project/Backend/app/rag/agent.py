"""
LangGraph Job RAG Agent — with LLM-based intent classification and Tavily web search.
Sync API: run_agent(thread_id, user_message) -> { reply, sources, web_sources }.
"""

import os
import uuid
from typing import TypedDict, Annotated, List, Dict, Optional
from dotenv import load_dotenv
import ollama
import pymongo
from tavily import TavilyClient
from langchain_groq import ChatGroq
from langchain_core.messages import BaseMessage, SystemMessage, HumanMessage, AIMessage
from langchain_core.output_parsers import StrOutputParser
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver
from operator import add

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME", "job_records")
COLLECTION_NAME = os.getenv("COLLECTION_NAME", "jobs")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")

EMBED_MODEL = os.getenv("MODEL_NAME", "qwen3-embedding:0.6b")
CHAT_MODEL = "llama-3.3-70b-versatile"

TOP_K = 10
MIN_SCORE = 0.3
MAX_CONTEXT_CHARS = 5000

llm = ChatGroq(model=CHAT_MODEL, temperature=0)

tavily_client = TavilyClient(api_key=TAVILY_API_KEY) if TAVILY_API_KEY else None

_collection = None


def _get_collection():
    global _collection
    if _collection is None:
        client = pymongo.MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        client.admin.command("ping")
        _collection = client[DB_NAME][COLLECTION_NAME]
    return _collection


def validate_query(query: str) -> bool:
    return bool(query and len(query.strip()) >= 3)


def embed_query(query: str):
    return ollama.embeddings(model=EMBED_MODEL, prompt=query)["embedding"]


def cosine_similarity(vec1, vec2):
    """Calculate cosine similarity between two vectors."""
    dot_product = sum(a * b for a, b in zip(vec1, vec2))
    magnitude1 = sum(a * a for a in vec1) ** 0.5
    magnitude2 = sum(b * b for b in vec2) ** 0.5

    if magnitude1 == 0 or magnitude2 == 0:
        return 0

    return dot_product / (magnitude1 * magnitude2)


def retrieve_documents(query_embedding, company_filter: Optional[str] = None):
    collection = _get_collection()

    # Build match condition for company filter
    match_condition = {}
    if company_filter:
        match_condition["company"] = {"$regex": company_filter, "$options": "i"}

    # First get jobs (optionally filtered by company)
    if match_condition:
        pipeline = [
            {"$match": match_condition},
            {
                "$project": {
                    "_id": 0,
                    "company": 1,
                    "job_title": 1,
                    "location": 1,
                    "skills_required": 1,
                    "job_description_summary": 1,
                    "job_url": 1,
                    "role": 1,
                    "experience": 1,
                    "salary": 1,
                    "employment_type": 1,
                    "posted_date": 1,
                    "job_embedding": 1,
                }
            },
        ]
    else:
        pipeline = [
            {
                "$vectorSearch": {
                    "index": "vector_index",
                    "path": "job_embedding",
                    "queryVector": query_embedding,
                    "numCandidates": 50,
                    "limit": TOP_K,
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
                    "role": 1,
                    "experience": 1,
                    "salary": 1,
                    "employment_type": 1,
                    "posted_date": 1,
                    "score": {"$meta": "vectorSearchScore"},
                }
            },
        ]

    results = list(collection.aggregate(pipeline))

    # If company filter was used, calculate similarity scores manually
    if company_filter and results and "job_embedding" in results[0]:
        for job in results:
            if "job_embedding" in job:
                job["score"] = cosine_similarity(
                    query_embedding, job.get("job_embedding", [])
                )
            else:
                job["score"] = 0

        # Remove jobs without embeddings or with very low scores
        results = [r for r in results if r.get("score", 0) > 0.1]
        results.sort(key=lambda x: x.get("score", 0), reverse=True)
    elif not company_filter:
        # Apply score filter for non-company searches
        results = [r for r in results if r.get("score", 0) >= MIN_SCORE]

    return results


def build_context(docs):
    context = ""
    for i, doc in enumerate(docs, start=1):
        context += f"""
--- Job {i} ---
Company: {doc.get("company", "N/A")}
Job Title: {doc.get("job_title", "N/A")}
Location: {doc.get("location", "N/A")}
Skills Required: {", ".join(doc.get("skills_required", []))}
Role: {doc.get("role", "N/A")}
Experience: {doc.get("experience", "N/A")}
Salary: {doc.get("salary", "N/A")}
Employment Type: {doc.get("employment_type", "N/A")}
Posted Date: {doc.get("posted_date", "N/A")}
Job URL: {doc.get("job_url", "N/A")}
Summary: {doc.get("job_description_summary", "N/A")}
"""
    return context.strip()


def trim_context(context: str):
    return context[:MAX_CONTEXT_CHARS]


def classify_intent(query: str) -> str:
    """
    LLM-based intent classification.
    Returns 'rag' for job-related queries, 'web' for general questions.
    """
    classification_prompt = f"""Classify the following user query into one of two categories:
- 'rag': The user is asking about jobs, roles, skills, careers, companies, salaries, locations, or wants job recommendations
- 'web': The user is asking general knowledge questions, how-to questions, definitions, explanations, or career advice that doesn't require specific job database information

User Query: {query}

Respond with ONLY 'rag' or 'web', no other text."""

    response = llm.invoke([HumanMessage(content=classification_prompt)])
    intent = str(response.content).strip().lower()

    if intent in ["rag", "web"]:
        return intent
    return "web"


def extract_company_from_query(query: str) -> str | None:
    """
    Use LLM to extract company name from user query if present.
    Returns the company name or None if not found.
    """
    extraction_prompt = f"""Extract the company name from the following user query if present.
Look for company names like "BNP Paribas", "Google", "Microsoft", "Amazon", etc.
If a company name is found, return ONLY the company name. If not found, return "NONE".

User Query: {query}

Respond with ONLY the company name or "NONE"."""

    response = llm.invoke([HumanMessage(content=extraction_prompt)])
    result = str(response.content).strip()

    if result.upper() == "NONE":
        return None
    return result


def tavily_search(query: str) -> List[Dict]:
    """Perform web search using Tavily API."""
    if not tavily_client:
        return []

    try:
        results = tavily_client.search(
            query=query, max_results=5, include_answer=True, include_raw_content=False
        )

        web_results = []
        for result in results.get("results", []):
            web_results.append(
                {
                    "title": result.get("title", "No title"),
                    "url": result.get("url", ""),
                    "content": result.get("content", "")[:500]
                    if result.get("content")
                    else "",
                }
            )
        return web_results
    except Exception as e:
        print(f"Tavily search error: {e}")
        return []


def build_web_context(web_results: List[Dict]) -> str:
    """Build context string from Tavily web results."""
    if not web_results:
        return ""

    context = "Web Search Results:\n"
    for i, result in enumerate(web_results, start=1):
        context += f"""
--- Result {i} ---
Title: {result.get("title", "N/A")}
URL: {result.get("url", "N/A")}
Content: {result.get("content", "N/A")}
"""
    return context.strip()


def generate_answer(
    question: str, context: str, history: List[BaseMessage], is_rag: bool = True
):
    if is_rag:
        system_prompt = """You are a professional Job & Career Assistant.
Your goal is to help users find relevant job opportunities and provide career guidance.

**Formatting Requirements:**
- Use **bold** for important terms, job titles, company names, and key information
- Use bullet points (•) or numbered lists (1., 2., 3.) for multiple items
- Add proper spacing between sections for readability
- Use headings (##) for different sections if needed
- Structure your response like a professional document

**Content Guidelines:**
1. Use ONLY the provided job context from the database
2. Cite specific job titles, companies, locations, and skills when available
3. Mention the top relevant jobs by their number (e.g., "Based on **Job 1** and **Job 2**...")
4. Include salary, experience requirements, and employment type when available
5. Be concise, factual, and professional

If the answer cannot be determined from the context, clearly state that and suggest refining the search."""
    else:
        system_prompt = """You are a professional Career Assistant providing helpful guidance.

**Formatting Requirements:**
- Use **bold** for important terms and key information
- Use bullet points (•) or numbered lists (1., 2., 3.) for multiple items
- Add proper spacing between sections for readability
- Structure your response like a professional document

**Content Guidelines:**
1. Provide accurate, helpful information based on web search results
2. Cite your sources by mentioning the **title** and **URL**
3. Be clear and structured in your response
4. If uncertain, acknowledge limitations"""

    history_str = "\n".join(
        [f"{msg.type.upper()}: {msg.content}" for msg in history[-6:]]
    )
    user_prompt = f"""User Question: {question}

Conversation History:
{history_str}

Relevant Context:
{context}

Provide a helpful, well-structured answer with proper formatting, bold text for important info, and citations where applicable."""

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_prompt),
    ]
    response = llm.invoke(messages)
    return response.content


class AgentState(TypedDict):
    messages: Annotated[List[BaseMessage], add]
    context: str
    sources: List[Dict]
    web_sources: List[Dict]
    query: str
    intent: str


def classify_intent_node(state: AgentState) -> Dict:
    """Node that classifies user intent using LLM."""
    last_msg = state["messages"][-1]
    query = (
        last_msg.content if isinstance(last_msg.content, str) else str(last_msg.content)
    )
    intent = classify_intent(query)
    return {"intent": intent, "query": query}


def rag_node(state: AgentState):
    """RAG node for job-related queries."""
    last_msg = state["messages"][-1]
    query = (
        last_msg.content if isinstance(last_msg.content, str) else str(last_msg.content)
    )
    if not validate_query(query):
        return {
            "messages": [
                AIMessage(content="Please ask a meaningful job-related question.")
            ],
            "context": "",
            "sources": [],
            "web_sources": [],
            "intent": "rag",
        }

    company_filter = extract_company_from_query(query)
    print(f"Query: {query}")
    print(f"Company filter: {company_filter}")

    # If company is found, add it to the search query for better vector matching
    search_query = query
    if company_filter:
        # Modify query to include company name for better vector matching
        search_query = f"{company_filter} {query}"

    query_embedding = embed_query(search_query)
    docs = retrieve_documents(query_embedding, company_filter=company_filter)

    if not docs and company_filter:
        docs = retrieve_documents(query_embedding, company_filter=None)
        print(f"No results with company filter, trying without...")

    if not docs:
        return {
            "messages": [AIMessage(content="No relevant Foundit jobs found.")],
            "context": "",
            "sources": [],
            "web_sources": [],
            "intent": "rag",
        }
    context = trim_context(build_context(docs))
    answer = generate_answer(query, context, state["messages"], is_rag=True)
    return {
        "messages": [AIMessage(content=answer)],
        "context": context,
        "sources": docs[:2],
        "web_sources": [],
        "query": query,
        "intent": "rag",
    }


def chat_node(state: AgentState):
    """Plain LLM chat without RAG or web search."""
    last_msg = state["messages"][-1]
    query = (
        last_msg.content if isinstance(last_msg.content, str) else str(last_msg.content)
    )

    system_prompt = """You are a professional Career Assistant.

**Formatting Requirements:**
- Use **bold** for important terms and key information
- Use bullet points (•) or numbered lists (1., 2., 3.) for multiple items
- Add proper spacing between sections for readability
- Structure your response like a professional document

Provide helpful, well-structured responses. If you don't know something, say so honestly."""

    messages = [SystemMessage(content=system_prompt)] + state["messages"][-6:]
    response = llm.invoke(messages)
    return {
        "messages": [response],
        "context": "",
        "sources": [],
        "web_sources": [],
        "query": query,
        "intent": "web",
    }


def tavily_node(state: AgentState):
    """Web search node for general questions."""
    last_msg = state["messages"][-1]
    query = (
        last_msg.content if isinstance(last_msg.content, str) else str(last_msg.content)
    )

    web_results = tavily_search(query)
    web_context = build_web_context(web_results)

    if not web_results:
        prompt = """You are a helpful Career Assistant. 
Provide helpful information based on your knowledge. 
If you don't know something, say so honestly."""
        messages = [SystemMessage(content=prompt)] + state["messages"][-6:]
        response = llm.invoke(messages)
        return {
            "messages": [response],
            "context": "",
            "sources": [],
            "web_sources": [],
            "query": query,
            "intent": "web",
        }

    answer = generate_answer(query, web_context, state["messages"], is_rag=False)
    return {
        "messages": [AIMessage(content=answer)],
        "context": web_context,
        "sources": [],
        "web_sources": web_results,
        "query": query,
        "intent": "web",
    }


workflow = StateGraph(AgentState)
workflow.add_node("classify", classify_intent_node)
workflow.add_node("rag", rag_node)
workflow.add_node("chat", chat_node)
workflow.add_edge(START, "classify")
workflow.add_conditional_edges(
    "classify", lambda state: state["intent"], {"rag": "rag", "web": "chat"}
)
workflow.add_edge("rag", END)
workflow.add_edge("chat", END)

memory = MemorySaver()
rag_agent = workflow.compile(checkpointer=memory)

sessions: Dict[str, str] = {}


def get_or_create_thread(session_id: str) -> str:
    if not session_id or session_id not in sessions:
        new_id = str(uuid.uuid4())
        sessions[new_id] = new_id
        return new_id
    return sessions[session_id]


def create_session() -> tuple[str, str]:
    session_id = str(uuid.uuid4())
    sessions[session_id] = session_id
    return session_id, session_id


def list_sessions() -> List[str]:
    return list(sessions.keys())


def run_agent(thread_id: str, user_message: str) -> Dict:
    """
    Run one agent turn. Returns { "reply": str, "sources": list, "web_sources": list }.
    """
    config = {"configurable": {"thread_id": thread_id}}
    initial = {"messages": [HumanMessage(content=user_message)]}
    reply = ""
    sources: List[Dict] = []
    web_sources: List[Dict] = []

    for event in rag_agent.stream(initial, config, stream_mode="values"):
        if "messages" in event:
            last = event["messages"][-1]
            if isinstance(last, AIMessage):
                reply = last.content or ""
        if "sources" in event and event["sources"]:
            sources = event["sources"]
        if "web_sources" in event and event["web_sources"]:
            web_sources = event["web_sources"]

    return {"reply": reply, "sources": sources, "web_sources": web_sources}
