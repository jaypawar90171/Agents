from typing import TypedDict, Annotated, Dict, List
from langgraph.graph import add_messages, StateGraph, END, START
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from dotenv import load_dotenv
from langgraph.prebuilt import ToolNode
from langchain.tools import tool
from foundit_scrapper2 import scrape_foundit, format_jobs_output
from web_scraper_selenium import scrape_foundit_paginated
from pydantic import BaseModel
import json


load_dotenv()

class JobArgs(BaseModel):
    keyword: str
    location: str

class ScrapeArgs(BaseModel):
    csv_path: str = "foundit_jobs.csv"
    urls: str = ""
    batch_number: int = 1

@tool("get_foundit_job_urls", args_schema=JobArgs)
def get_url_tools(keyword: str, location: str) -> str:
    """
    Returns a JSON list of job URLs for the given keyword/location
    by calling the selenium paginated scraper.
    """
    results = scrape_foundit_paginated(keyword, location)
    links = []
    for item in results:
        link = item.get("Link") if isinstance(item, dict) else None
        if link:
            links.append(link)
    
    print(f"\n✓ Found {len(links)} job URLs for '{keyword}' in '{location}'")
    return json.dumps({
        "total_urls": len(links),
        "urls": links,
        "message": f"Found {len(links)} job URLs. These will be processed in batches."
    }, ensure_ascii=False)

@tool("scrape_job_text", args_schema=ScrapeArgs)
def scrape_text_tool(csv_path: str = "foundit_jobs.csv", urls: str = "", batch_number: int = 1) -> str:
    """
    Scrapes detailed job information from URLs.
    Accepts either a CSV path or newline-separated URLs.
    Returns formatted job details.
    """
    if urls and urls.strip():
        url_list = [u.strip() for u in urls.splitlines() if u.strip()]
        print(f"\n Batch #{batch_number}: Scraping detailed information from {len(url_list)} URLs...")
        results = scrape_foundit(urls=url_list, extract_details=True)
    else:
        print(f"\n Scraping from CSV: {csv_path}")
        results = scrape_foundit(csv_path=csv_path, extract_details=True)
    
    # Format the results nicely
    formatted_output = format_jobs_output(results)
    
    return json.dumps({
        "jobs_data": results,
        "formatted_output": formatted_output,
        "batch_number": batch_number,
        "total_jobs_in_batch": len(results)
    }, ensure_ascii=False, default=str)

tools = [get_url_tools, scrape_text_tool]

llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0.7,
    max_tokens=2048
)
llm_with_tools = llm.bind_tools(tools)

SYSTEM_PROMPT = SystemMessage(content="""
You are a professional job search assistant. Follow these steps STRICTLY in order:

1. FIRST: Call get_foundit_job_urls with the keyword and location provided by the user.
   This will return a list of URLs and a total count.

2. THEN: You will receive the URLs. Process them in BATCHES of maximum 10 URLs each.
   For each batch, call scrape_job_text with:
   - urls parameter: newline-separated URLs for that batch
   - batch_number parameter: 1 for first batch, 2 for second, etc.

3. IMPORTANT: Never pass more than 10 URLs at a time to scrape_job_text.
   If you have 70 URLs, make 7 separate calls with 10 URLs each.
   
4. After ALL batches are completed, compile and display all the results.

RESPONSE FORMAT:
- Show progress as you process batches
- After all batches are done, display a summary of all jobs found
- Include all job details: title, company, location, salary, skills, and link

BATCH PROCESSING RULES:
- Maximum 10 URLs per scrape_job_text call
- Always increment batch_number for each call
- Wait for each batch to complete before calling the next batch
- Do not call multiple batches simultaneously
""")

class AgentState(TypedDict):
    messages: Annotated[list, add_messages]

def agent(state: AgentState):
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
    query = "Find Python jobs in Chennai and extract detailed information"
    print(f"\n🔍 Search Query: {query}\n")
    human = HumanMessage(content=query)

    response = search_app.invoke({"messages": [human]})
    print("\n=== FINAL RESULTS ===\n")
    
    # Extract and display the final response
    for msg in response["messages"]:
        if isinstance(msg, AIMessage) and msg.content:
            print(msg.content)