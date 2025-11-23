from typing import TypedDict, Annotated, Dict, List
from langgraph.graph import add_messages, StateGraph, END, START
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from dotenv import load_dotenv
from langchain_tavily import TavilySearch
from IPython.display import display, Image
from langchain_core.runnables.graph import MermaidDrawMethod
from langgraph.prebuilt import ToolNode
from langchain.tools import tool
from foundit_scrapper2 import scrape_foundit
from web_scraper_selenium import scrape_foundit_paginated
from pydantic import BaseModel
import json


load_dotenv()

class JobArgs(BaseModel):
    keyword: str
    location: str

class ScrapeTextArgs(BaseModel):
    csv_path: str = "foundit_jobs.csv"
    urls: str = ""

@tool("get_foundit_job_urls", args_schema=JobArgs)
def get_url_tools(keyword: str, location: str) -> List[str]:
    """
    Returns a list of job URLs (strings) for the given keyword/location
    by calling the selenium paginated scraper.
    """
    results = scrape_foundit_paginated(keyword, location)
    links = []
    for item in results:
        link = item.get("Link") if isinstance(item, dict) else None
        if link:
            links.append(link)
    return json.dumps(links, ensure_ascii=False)

@tool("scrape_job_text")
def scrape_text_tool(csv_path: str = "foundit_jobs.csv", urls: str = "") -> list:
    """
    Scrapes job page text. Accepts either a CSV path (csv_path) or
    newline-separated URLs in 'urls'. Returns list of dicts: {'url':..., 'content':...}
    """
    if urls and urls.strip():
        url_list = [u.strip() for u in urls.splitlines() if u.strip()]
        results = scrape_foundit(urls=url_list)
    else:
        results = scrape_foundit(csv_path=csv_path)
    return json.dumps(results, ensure_ascii=False)

tools = [get_url_tools, scrape_text_tool]

llm = ChatGroq(
    model="llama-3.1-8b-instant",
    temperature=0.7,
    max_tokens=1024
)
llm_with_tools = llm.bind_tools(tools)

SYSTEM_PROMPT = SystemMessage(content="""
You are a data-gathering assistant for job searching. Follow these rules STRICTLY:

1. FIRST: Call get_foundit_job_urls with the keyword and location provided by the user.
2. WAIT for the results from get_foundit_job_urls to return.
3. THEN: Once you have the URLs, call scrape_job_text with those URLs (pass them as newline-separated URLs in the 'urls' parameter).
4. Do NOT call scrape_job_text until you have actual URLs from get_foundit_job_urls.
5. After scraping is complete, provide a summary of the jobs found.

IMPORTANT: Never call both tools simultaneously. Always call get_foundit_job_urls first, wait for results, then call scrape_job_text.
""")

class AgentState(TypedDict):
    messages: Annotated[list, add_messages]

def agent(state: AgentState):
    # Include system prompt in messages
    messages = [SYSTEM_PROMPT] + state["messages"]
    return {"messages": [llm_with_tools.invoke(messages)]}

def tool_router(state: AgentState):
    last_message = state["messages"][-1]
    if hasattr(last_message, "tool_calls") and len(last_message.tool_calls) > 0:
        return "tool_node"
    else:
        return END
    
tool_node = ToolNode(tools=tools)

subgraph = StateGraph(AgentState)
subgraph.add_node("agent", agent)
subgraph.add_node("tool_node", tool_node)
subgraph.set_entry_point("agent")
subgraph.add_conditional_edges("agent", tool_router)
subgraph.add_edge("tool_node", "agent")
search_app = subgraph.compile()

if __name__ == "__main__":
    query = "Find latest Python jobs in chennai and extract page text"
    human = HumanMessage(content=query)

    response = search_app.invoke({"messages": [human]})
    print("=== AGENT RESPONSE ===")
    print(response)