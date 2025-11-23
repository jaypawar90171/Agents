from typing import TypedDict, Annotated, Dict
from langgraph.graph import add_messages, StateGraph, END, START
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from dotenv import load_dotenv
from langchain_tavily import TavilySearch
from IPython.display import display, Image
from langchain_core.runnables.graph import MermaidDrawMethod
from langgraph.prebuilt import ToolNode

load_dotenv()

class childState(TypedDict):
    messages: Annotated[list, add_messages]

search_tool = TavilySearch(
    max_results=2,
    include_raw_content=False,
    include_answer=True,
    search_depth="advanced"
)
tools = [search_tool]

llm = ChatGroq(
    model="llama-3.1-8b-instant",
    temperature=0.7,
    max_tokens=1024
)
llm_with_tools = llm.bind_tools(tools)