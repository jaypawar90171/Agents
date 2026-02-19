import os
import sys
import uuid
from typing import TypedDict, Annotated, List, Dict, Any
from dotenv import load_dotenv
import ollama
import pymongo
from langchain_groq import ChatGroq
from langchain_core.messages import BaseMessage, SystemMessage, HumanMessage, AIMessage
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver
from operator import add

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME", "job_records")
COLLECTION_NAME = os.getenv("COLLECTION_NAME", "jobs")

EMBED_MODEL = os.getenv("MODEL_NAME", "qwen3-embedding:0.6b")
CHAT_MODEL = "llama-3.3-70b-versatile"

TOP_K = 5
MIN_SCORE = 0.6
MAX_CONTEXT_CHARS = 3500

llm = ChatGroq(
    model=CHAT_MODEL,
    temperature=0
)

try:
    client = pymongo.MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    client.admin.command("ping")
    collection = client[DB_NAME][COLLECTION_NAME]
    print(f"Connected to database: {DB_NAME}[web:1]")
except Exception as e:
    print(f"Database connection failed: {e}")
    sys.exit(1)

# --------------------------------------------------
# RAG Components (unchanged)
# --------------------------------------------------
def validate_query(query: str) -> bool:
    return bool(query and len(query.strip()) >= 3)

def embed_query(query: str):
    return ollama.embeddings(
        model=EMBED_MODEL,
        prompt=query
    )["embedding"]

def retrieve_documents(query_embedding):
    pipeline = [
        {
            "$vectorSearch": {
                "index": "vector_index",
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
    return list(collection.aggregate(pipeline))

def build_context(docs):
    context = ""
    for i, doc in enumerate(docs, start=1):
        context += f"""
                --- Job {i} ---
                Company: {doc.get('company', 'N/A')}
                "Job URL: {doc.get('job_url', 'N/A')}
                Job Title: {doc.get('job_title', 'N/A')}
                Location: {doc.get('location', 'N/A')}
                Skills Required: {', '.join(doc.get('skills_required', []))}
                Summary: {doc.get('job_description_summary', 'N/A')}
                """
    return context.strip()

def trim_context(context: str):
    return context[:MAX_CONTEXT_CHARS]

def generate_answer(question: str, context: str, history: List[BaseMessage]):
    system_prompt = (
        "You are a professional Job & Career Assistant.\n"
        "Answer ONLY using the provided job context.\n"
        "If the answer is not present in the context, say so clearly.\n"
        "Be concise, factual, and professional.\n"
        "Use the conversation history to provide context-aware responses."
    )

    history_str = "\n".join([f"{msg.type.upper()}: {msg.content}" for msg in history[-6:]] )  # Last 3 exchanges

    user_prompt = f"""
        User Question: {question}

        Conversation History:
        {history_str}

        Relevant Job Context:
        {context}
        """

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_prompt)
    ]

    response = llm.invoke(messages)

    return response.content

# --------------------------------------------------
# LangGraph Agent State
# --------------------------------------------------
class AgentState(TypedDict):
    messages: Annotated[List[BaseMessage], add]
    context: str
    sources: List[Dict]
    query: str

# --------------------------------------------------
# Agent Nodes
# --------------------------------------------------
def route_query(state: AgentState):
    """Router: RAG or general chat"""
    last_msg = state['messages'][-1].content.lower()
    if any(word in last_msg for word in ['job', 'position', 'role', 'career', 'apply', 'foundit', 'skills', 'location', 'apply link', 'url']):
        return "rag"
    return "chat"

def rag_node(state: AgentState):
    query = state['messages'][-1].content

    if not validate_query(query):
        return {
            "messages": [AIMessage(content="Please ask a meaningful job-related question.")],
            "context": "",
            "sources": []
        }

    print(f"\nSearching Foundit for: {query}")

    query_embedding = embed_query(query)
    docs = retrieve_documents(query_embedding)

    if not docs:
        return {
            "messages": [AIMessage(content="No relevant Foundit jobs found.")],
            "context": "",
            "sources": []
        }

    context = trim_context(build_context(docs))
    answer = generate_answer(query, context, state['messages'])

    return {
        "messages": [AIMessage(content=answer)],
        "context": context,
        "sources": docs,
        "query": query
    }

def chat_node(state: AgentState):
    """Direct chat without RAG"""
    prompt = (
        "You are a helpful Job & Career Assistant.\n"
        "Help with career advice, resume tips, interview prep, or job search strategies.\n"
        "If they ask about specific jobs, suggest using job search commands."
    )
    messages = [SystemMessage(content=prompt)] + state['messages'][-6:]
    response = llm.invoke(messages)
    return {"messages": [response]}

# --------------------------------------------------
# LangGraph Workflow
# --------------------------------------------------
workflow = StateGraph(AgentState)

workflow.add_node("rag", rag_node)
workflow.add_node("chat", chat_node)

# Router
workflow.add_conditional_edges(
    START,
    route_query,
    {
        "rag": "rag",
        "chat": "chat"
    }
)

# End after nodes
workflow.add_edge("rag", END)
workflow.add_edge("chat", END)

# Compile with memory (handles sessions via thread_id)
memory = MemorySaver()
rag_agent = workflow.compile(checkpointer=memory)

# --------------------------------------------------
# Interactive Chat with Session Management (Perplexity-like)
# --------------------------------------------------
sessions: Dict[str, str] = {}  # session_name -> thread_id

def get_or_create_session(session_name: str):
    if session_name not in sessions:
        sessions[session_name] = str(uuid.uuid4())
        print(f"New conversation created: {session_name} (thread: {sessions[session_name][:8]})")
    return sessions[session_name]

if __name__ == "__main__":
    print("Perplexity-like Job RAG Chatbot")
    print("Commands: /new <name> - new conversation, /switch <name> - switch, /list - sessions, /quit - exit\n")

    current_session = "default"
    config = {"configurable": {"thread_id": get_or_create_session(current_session)}}

    while True:
        user_input = input(f"({current_session}) You: ").strip()

        if user_input.lower() == "/quit":
            break
        elif user_input.startswith("/new "):
            name = user_input[5:].strip() or f"session_{len(sessions)+1}"
            current_session = name
            config["configurable"]["thread_id"] = get_or_create_session(current_session)
            continue
        elif user_input.startswith("/switch "):
            name = user_input[8:].strip()
            if name in sessions:
                current_session = name
                config["configurable"]["thread_id"] = sessions[name]
                print(f"Switched to: {current_session}")
            else:
                print("Session not found. Use /new to create.")
            continue
        elif user_input == "/list":
            print("Sessions:", ", ".join(sessions.keys()))
            continue
        elif not user_input:
            continue

        # Run agent
        for event in rag_agent.stream(
            {"messages": [HumanMessage(content=user_input)]},
            config,
            stream_mode="values"
        ):
            if "messages" in event:
                last_msg = event["messages"][-1]
                if isinstance(last_msg, AIMessage):
                    print(f"Bot: {last_msg.content}")
                    if "sources" in event and event["sources"]:
                        print(f"(Sources available - {len(event['sources'])} jobs found)")
                        for i, src in enumerate(event["sources"], start=1):
                            print(f"  [{i}] {src.get('job_title', 'N/A')} at {src.get('company', 'N/A')} - {src.get('job_url', 'N/A')}")

        print()  # New line for readability
