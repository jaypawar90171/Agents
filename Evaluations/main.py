import os
import uuid
from typing import TypedDict, Annotated, List, Dict, Optional, Literal
from dotenv import load_dotenv
import pymongo
from langchain_groq import ChatGroq
from langchain_core.messages import BaseMessage, SystemMessage, HumanMessage, AIMessage
from langchain_core.output_parsers import StrOutputParser
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver
from operator import add
# from langchain_mongodb import MongoDBAtlasVectorSearch 
from pymongo import MongoClient
from langchain_huggingface import HuggingFaceEmbeddings
from pydantic import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate
from IPython.display import Image, display
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_core.documents import Document
from langchain_community.embeddings import OllamaEmbeddings
from langchain_mongodb import MongoDBAtlasVectorSearch
from pymongo import MongoClient

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME", "job_records")
COLLECTION_NAME = os.getenv("COLLECTION_NAME", "jobs")

EMBED_MODEL = os.getenv("MODEL_NAME", "qwen3-embedding:0.6b")
CHAT_MODEL = "llama-3.3-70b-versatile"

TOP_K = 10
MIN_SCORE = 0.6
MAX_CONTEXT_CHARS = 5000

print(f"Using embedding model: {EMBED_MODEL}")

# Then your initialization code:
embeddings = OllamaEmbeddings(model=EMBED_MODEL)
client = MongoClient(MONGO_URI)
collection = client[DB_NAME][COLLECTION_NAME]

vector_store = MongoDBAtlasVectorSearch(
    collection=collection,  
    embedding=embeddings,
    index_name="vector_index",
    text_key="job_description_summary",
    embedding_key="job_embedding"
)

retriever = vector_store.as_retriever(
    search_type="similarity",
    search_kwargs={"k": 5}
)

class RouteQuery(BaseModel):
    """Route the user query to the most relevant datasource based on topic."""

    datasource: Literal["vectorstore", "web_search"] = Field(
        ..., 
        description="Choose 'vectorstore' for questions about companies, job roles, skills, or placements. Choose 'web_search' for general knowledge or current events."
    )
llm = ChatGroq(model=CHAT_MODEL, temperature=0)
# LLM with function call
structured_llm_router = llm.with_structured_output(RouteQuery)

#prompt
system = """You are an expert recruitment and career-path router. 
Your job is to direct user inquiries to the correct data source.

VECTORSTORE CRITERIA:
- Questions about specific companies (e.g., 'What is Morgan Stanley looking for?').
- Inquiries regarding placements, internships, or hiring processes.
- Requests for skills required for specific roles (e.g., 'Java skills for Accenture').
- Career advice related to corporate job markets.

WEB_SEARCH CRITERIA:
- General knowledge questions not related to specific companies or jobs.
- Current news, weather, or non-career topics.
- Topics outside the scope of professional recruitment and placements.

If the question is even remotely related to jobs, companies, or skills, PRIORITIZE the vectorstore."""

route_prompt = ChatPromptTemplate.from_messages(
    [
        ("system", system),
        ("human", "{question}")
    ]
)

question_router = route_prompt | structured_llm_router

class GradeDocuments(BaseModel):
    """
    Binary score for relevance check on retrieved documents..
    """

    binary_score: str = Field(
        description="Relevance score: 'yes' if the document is useful for answering the question, 'no' if it is not."
    )

structured_llm_grader = llm.with_structured_output(GradeDocuments)

system = """
You are a grader assessing relevance of a retrieved document to a user question.\n
Determines if a retrieved document is relevant to the user's question.\n
    
Relevance Criteria:
- The document contains keywords or semantic concepts related to the question.
- The document provides information that could help formulate an answer.
- It does NOT need to be a complete answer to be considered 'yes'.
- If the document is completely unrelated, score it as 'no'.
"""

grade_prompt = ChatPromptTemplate.from_messages(
    [
        ("system", system),
        ("human", "Retrieved document: \n\n {document} \n\n User question: {question}"),
    ]
)

retrieval_grader = grade_prompt | structured_llm_grader

from langchain_core.output_parsers import StrOutputParser

# A more robust, professional RAG prompt
template = """You are an expert assistant for question-answering tasks. 
Use the following pieces of retrieved context to answer the question. 

---
CONTEXT:
{context}
---

INSTRUCTIONS:
1. If the answer is not contained within the context, clearly state that you do not know. 
2. Do not attempt to make up an answer or use outside knowledge. 
3. Keep the answer concise (3-5 sentences) and professional.
4. Use bullet points if the information is a list.

QUESTION: 
{question}

HELPFUL ANSWER:"""

prompt = ChatPromptTemplate.from_template(template)

rag_chain = prompt | llm | StrOutputParser()

system = """You are an expert Search Query Optimizer. Your goal is to take a vague user 
question and transform it into a high-precision search query for a web engine.

CRITERIA FOR A GOOD QUERY:
1. **Semantic Expansion**: Identify the likely industry (e.g., IT Consulting) and role levels.
2. **Remove Ambiguity**: Replace 'Skills for [Company]' with specific categories like 'Technical Stack', 'Soft Skills', or 'Certification requirements'.
3. **Recency**: Include keywords for the current year (2024-2026) to ensure the search results aren't outdated.
4. **Intent-Based**: If the intent is job-seeking, include terms like 'hiring process', 'interview preparation', or 'job requirements'.

Output ONLY the improved query string. No conversational filler."""

re_write_prompt = ChatPromptTemplate.from_messages(
    [
        ("system", system),
        ("human", "Initial Question: {question}\n\nOptimized Search Query:"),
    ]
)

question_rewriter = re_write_prompt | llm | StrOutputParser()

class GradeHallucination(BaseModel):
    """Binary score for hallucination check."""
    binary_score: str = Field(description="Answer is grounded in the facts, 'yes' or 'no'")

structured_llm_grader = llm.with_structured_output(GradeHallucination)

system = """You are a grader assessing whether an LLM generation is grounded in / supported by a set of retrieved facts. 
Give a binary score 'yes' or 'no'. 'yes' means the generation is supported by the facts. 
Be lenient with phrasing; as long as the factual claim exists in the source, it is 'yes'."""

hallucination_prompt = ChatPromptTemplate.from_messages([
    ("system", system),
    ("human", "Set of facts: \n\n {documents} \n\n LLM Generation: {generation}"),
])

hallucination_grader = hallucination_prompt | structured_llm_grader

class GradeAnswer(BaseModel):
    """Binary score to assess answer address question."""
    binary_score: str = Field(description="Answer address the question, 'yes' or 'no'")

structured_llm_grader = llm.with_structured_output(GradeAnswer)

system = """You are a grader assisting whether an answer address / resolves question. 
Give a binary score 'yes' or 'no'. 'yes' means answers resolves the question. 
Be lenient with phrasing; as long as the factual claim exists in the source, it is 'yes'."""

answer_prompt = ChatPromptTemplate.from_messages([
    ("system", system),
    ("human", "User Question: \n\n {question} \n\n LLM Generation: {generation}"),
])

answer_grader = answer_prompt | structured_llm_grader


web_search_tool = TavilySearchResults(k=3)


from typing import List

class GraphState(TypedDict):
    """
    Represents the state of our graph.

    Attributes:
        question: question
        generation: LLM generation
        web_search: whether to add search
        documents: list of documents
    """

    question: str
    generation: str
    web_search: str
    documents: List[str]

def retrieve(state):
    """
    Retrieves relevant documents from the vector database based on the user's question.

    This function acts as a retrieval node in the RAG graph. It takes the current 
    'question' from the state, converts it into a search query (embedding), 
    and fetches the top-k most semantically similar document chunks from the 
    ChromaDB/Pinecone vector store.

    Args:
        state (dict): The current graph state containing:
            - "question": The string query to search for.

    Returns:
        dict: An updated state dictionary with:
            - "documents": A list of retrieved Document objects.
            - "question": The original question.
    """

    print("---RETRIEVE NODE---")
    question = state["question"]

    docs = retriever.invoke(question)
    context = "\n\n".join([
    f"""
    Company: {doc.metadata.get('company')}
    Title: {doc.metadata.get('job_title')}
    Skills: {doc.metadata.get('skills_required')}
    Location: {doc.metadata.get('location')}
    Description: {doc.page_content}
    """
    for doc in docs
])
    return {"documents": context, "question": question}

def generate(state):
    """
    Synthesizes a final answer by grounding the LLM's response in retrieved context.

    This node performs the 'R' (Retrieval) and 'G' (Generation) alignment. It 
    constructs a prompt using the 'documents' list and the 'question' stored 
    in the state, then invokes the LLM to generate a concise, fact-based response.

    Args:
        state (dict): The current graph state containing:
            - "question" (str): The user's original or rewritten query.
            - "documents" (List[Document]): A list of filtered, relevant document 
              chunks to be used as context.

    Returns:
        dict: The updated state dictionary with:
            - "generation" (str): The final natural language response from the LLM.
            - "documents" (List[Document]): Passes through the context used for 
              potential citation or source-tracking.
    """

    print("---GENERATE NODE---")
    question = state["question"]
    context = state["documents"]

    # RAG generation
    generation = rag_chain.invoke({"context": context, "question": question})
    return {"documents": context, "question": question, "generation": generation}

def grade_documents(state):
    """
    Determines whether the retrieved documents are relevant to the question.

    Args:
        state (dict): The current graph state

    Returns:
        state (dict): Updates documents key with only filtered relevant documents
    """

    print("---GRADE DOCUEMENT NODE---")
    question = state["question"]
    documents = state["documents"]

    # Score each doc
    filtered_docs = []
    for c in documents.split("\n\n"):
        if not c.strip():
            continue
        score = retrieval_grader.invoke(
            {"question": question, "document": c}
        )

        grade = score.binary_score
        if grade == "yes":
            print("---GRADE: DOCUMENT RELEVANT---")
            filtered_docs.append(c)
        else:
            print("---GRADE: DOCUMENT NOT RELEVANT---")
            continue

    return {"documents": "\n\n".join(filtered_docs), "question": question}


def transform_query(state):
    """
    Transform the query to produce a better question.

    Args:
        state (dict): The current graph state

    Returns:
        state (dict): Updates question key with a re-phrased question
    """

    print("---TRANSFORM QUERY---")
    question = state["question"]
    documents = state["documents"]

    # Re-write question
    better_question = question_rewriter.invoke({"question": question})
    return {"documents": documents, "question": better_question}

def web_search(state):
    """
    Web search based on the re-phrased question.

    Args:
        state (dict): The current graph state

    Returns:
        state (dict): Updates documents key with appended web results
    """

    print("---WEB SEARCH---")
    question = state["question"]

    # Web search
    docs = web_search_tool.invoke({"query": question})
    web_results = "\n".join([d["content"] for d in docs])

    return {"documents": web_results, "question": question}

def route_question(state):
    """
    Route the question to web search or RAG.
    
    Args:
        state (dict): The current graph state
        
    Returns:
        str: Next node to call (the router result)
    """

    print("---ROUTING QUESTION---")
    question = state["question"]
    source = question_router.invoke({"question": question})

    if source.datasource == 'web_search':
        print("---ROUTE TO WEB SEARCH---")
        return "web_search"
    elif source.datasource == 'vectorstore':
        print("---ROUTE TO RETRIEVAL---")
        return "vectorstore"

def decide_to_generate(state):
    """
    Determines whether to generate an answer, or re-generate a question.

    Args:
        state (dict): The current graph state

    Returns:
        str: Binary decision for next node to call
    """

    print("---ASSESS GRADED DOCUMENTS---")
    state["question"]
    filtered_documents = state["documents"]

    if not filtered_documents:
        # All documents have been filtered check_relevance
        # We will re-generate a new query
        print(
            "---DECISION: ALL DOCUMENTS ARE NOT RELEVANT TO QUESTION, TRANSFORM QUERY---"
        )
        return "transform_query"
    else:
        # We have relevant documents, so generate answer
        print("---DECISION: GENERATE---")
        return "generate"


def grade_generation_v_documents_and_question(state):
    """
    Determines whether the generation is grounded in the document and answers question.

    Args:
        state (dict): The current graph state

    Returns:
        str: Decision for next node to call
    """

    print("---CHECK HALLUCINATIONS---")
    question = state["question"]
    documents = state["documents"]
    generation = state["generation"]

    score = hallucination_grader.invoke(
        {"documents": documents, "generation": generation}
    )
    grade = score.binary_score

    # Check hallucination
    if grade == "yes":
        print("---DECISION: GENERATION IS GROUNDED IN DOCUMENTS---")
        # Check question-answering
        print("---GRADE GENERATION vs QUESTION---")
        score = answer_grader.invoke({"question": question, "generation": generation})
        grade = score.binary_score
        if grade == "yes":
            print("---DECISION: GENERATION ADDRESSES QUESTION---")
            return "useful"
        else:
            print("---DECISION: GENERATION DOES NOT ADDRESS QUESTION---")
            return "not useful"
    else:
        print("---DECISION: GENERATION IS NOT GROUNDED IN DOCUMENTS, TRANSFORM QUERY---")
        return "transform_query"


workflow = StateGraph(GraphState)

# Define the nodes
workflow.add_node("web_search", web_search)  # web search
workflow.add_node("retrieve", retrieve)  # retrieve
workflow.add_node("grade_documents", grade_documents)  # grade documents
workflow.add_node("generate", generate)  # generate
workflow.add_node("transform_query", transform_query)  # transform_query

# Build graph
workflow.add_conditional_edges(
    START,
    route_question,
    {
        "web_search": "web_search",
        "vectorstore": "retrieve",
    },
)
workflow.add_edge("web_search", "generate")
workflow.add_edge("retrieve", "grade_documents")
workflow.add_conditional_edges(
    "grade_documents",
    decide_to_generate,
    {
        "transform_query": "transform_query",
        "generate": "generate",
    },
)
workflow.add_edge("transform_query", "retrieve")
workflow.add_conditional_edges(
    "generate",
    grade_generation_v_documents_and_question,
    {
        "transform_query": "transform_query",
        "useful": END,
        "not useful": "transform_query",
    },
)


# Compile
app = workflow.compile()