from typing import TypedDict, Annotated, Dict, List, Literal
from langgraph.graph import add_messages, StateGraph, END, START
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, BaseMessage
from dotenv import load_dotenv
from langchain_tavily import TavilySearch
from IPython.display import display, Image
from langchain_core.runnables.graph import MermaidDrawMethod
from langgraph.prebuilt import ToolNode
from langchain_core.pydantic_v1 import BaseModel, Field
import operator

load_dotenv()

class JobPosting(BaseModel):
    """A standardized Pydantic model for a single job posting."""
    title: str = Field(description="The job title (e.g., 'Software Engineer').")
    company: str = Field(description="The name of the company.")
    location: str = Field(description="The job location (e.g., 'Bangalore').")
    skiils: str = Field(description="Skiils for particular Job (e.g., Python, DSA)")
    salary: str = Field(description="Salary for the particular job")
    source: str = Field(description="The job board source (e.g., 'Indeed').")
    url: str = Field(description="The direct URL to the job posting.")

# Define the state schema
class childState(TypedDict):
    """
    Represents the state of the job scraping workflow.
    """
    messages: Annotated[List[BaseMessage], add_messages]
    raw_data: Annotated[List[JobPosting], operator.add]
    status: Literal[
        "INITIALIZE", 
        "SCRAPE_TIMESJOB", 
        "SCRAPE_INDEED", 
        "SCRAPE_NAUKRI", 
        "HANDLE_ERROR", 
        "COMPLETE"
    ]
    user_query: str
    error_message: str

# --- 2. Tools and LLM Initialization ---
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


# --- 3. Node Functions (placeholders with error handling structure) ---
def initialize_agent(state: childState) -> dict:
    """
    Initial node to set up the workflow and refine the query using LLM tools.
    """
    print("\n--- Initialize Agent ---")

    return {
        "messages": [AIMessage(content=f"Starting job scraping for: {state['user_query']}")],
        "status": "SCRAPE_TIMESJOB",
        "error_message": "",
        "raw_data": []
    }


# First Node that will scrape the timejob and give the raw data
def timesjob_scrapper():
    """ Node to scrape TimesJob. """
    print("--- Running TimesJob Scrapper ---")

    return {
            "raw_data": "",
            "messages": [SystemMessage(content="TimesJob scraping successful.")],
            "status": "STORE_TIMESJOB"
        }

# Second Node that save the data in a excel file for tiemsjob
def timesjob_store():
    """Node to save TimesJob data to an excel file."""
    print("--- Storing TimesJob Data ---")
    
    return {
        "messages": [SystemMessage(content="TimesJob data stored successfully.")],
        "status": "SCRAPE_INDEED"
    }

# Third Node will scrape the indeed and give the raw data
def indeed_scrapper():
    """ Node to scrape Indeed. """
    print("--- Running Indeed Scrapper ---")
    
    return {
        "raw_data": "",
        "messages": [SystemMessage(content="Indeed scraping successful.")],
        "status": "STORE_INDEED"
    }

# Fourth Node that save the data in a excel file for indeed
def indeed_store():
    """ Node to save TimesJob data to an excel file. """
    print("--- Storing Indeed Data ---")
    return {
        "messages": [SystemMessage(content="Indeed data stored successfully.")],
        "status": "SCRAPE_NAUKRI"
    }

# Fifth Node will scrape the naukri and give the raw data
def naukri_scrapper():
    """ Node to scrape Naukri. """
    print("--- Running Indeed Scrapper ---")
    
    return {
        "raw_data": "",
        "messages": [SystemMessage(content="Naukri scraping successful.")],
        "status": "STORE_NAUKRI"
    }

# Fourth Node that save the data in a excel file for naukri
def naukri_store():
    """ Node to save Naukri data to an excel file. """
    print("--- Storing Naukri Data ---")

    
    return {
        "messages": [SystemMessage(content="Naukri data stored successfully.")],
        "status": "COMPLETE"
    }

def error_handler(state: childState) -> dict:
    """
    Handles errors: logs the issue, potentially retries, or escalates (human-in-the-loop).
    """
    print(f"\n!!! ERROR HANDLER ACTIVATED !!!")
    print(f"Error: {state['error_message']}")
    
    # In a real agent, you might implement retry logic here based on error_count
    # For now, we terminate the scraping process but proceed to summary.
    
    return {
        "messages": [AIMessage(content=f"Process interrupted due to error: {state['error_message']}. Proceeding to final report.")],
        "status": "COMPLETE"
    }

def summary_report(state: childState) -> dict:
    """
    Generates a final report/summary of the scraping run.
    """
    print("\n--- Generating Summary Report ---")
    
    # LLM could be used here to summarize the results in a user-friendly way
    final_count = len(state.get("raw_data", []))
    summary_msg = f"Scraping run finished. Total jobs collected: {final_count}."
    
    return {
        "messages": [SystemMessage(content=summary_msg)]
    }

# this is function not the node
def route_to_next_step(state: childState) -> str:
    """
    Conditional routing logic based on the current 'status'.
    """
    if state["status"] == "STORE_TIMESJOB":
        return "indeed_scapper"
    elif state["status"] == "STORE_INDEED":
        return "naukri_scrapper"
    elif state["status"] == "STORE_NAUKRI":
        return "summary_report"
    elif state["status"] == "HANDLE_ERROR":
        # Any failure routes here
        return "error_handler"
    elif state["status"] == "COMPLETE":
        return "END"
    else:
        # Fallback for the sequential scrapers/stores
        return state["status"]


# --- 4. Graph Structure Definition (The State Machine) ---
subgraph = StateGraph(childState)

# Add all nodes
subgraph.add_node("initialize_agent", initialize_agent)
subgraph.add_node("timesjob_scrapper", timesjob_scrapper)
subgraph.add_node("timesjob_store", timesjob_store)
subgraph.add_node("indeed_scrapper", indeed_scrapper)
subgraph.add_node("indeed_store", indeed_store)
subgraph.add_node("naukri_scrapper", naukri_scrapper)
subgraph.add_node("naukri_store", naukri_store)
subgraph.add_node("error_handler", error_handler)
subgraph.add_node("summary_report", summary_report)

# Set entry point
subgraph.set_entry_point("initialize_agent")

# Add edges
subgraph.add_edge("initialize_agent", "timesjob_scrapper")

subgraph.add_conditional_edges(
    "timesjob_scrapper",
    route_to_next_step,
    {
        "STORE_TIMESJOB": "timesjob_store", 
        "HANDLE_ERROR": "error_handler",     
    }
)

subgraph.add_conditional_edges(
    "timesjob_store",
    route_to_next_step,
    {
        "SCRAPE_INDEED": "indeed_scrapper"
    } 
)

subgraph.add_conditional_edges(
    "indeed_scrapper",
    route_to_next_step,
    {
        "STORE_INDEED": "indeed_store",
        "HANDLE_ERROR": "error_handler",
    }
)

subgraph.add_conditional_edges(
    "indeed_store",
    route_to_next_step,
    {"SCRAPE_NAUKRI": "naukri_scrapper"}
)

subgraph.add_conditional_edges(
    "naukri_scrapper",
    route_to_next_step,
    {
        "STORE_NAUKRI": "naukri_store",
        "HANDLE_ERROR": "error_handler",
    }
)

subgraph.add_conditional_edges(
    "naukri_store",
    route_to_next_step,
    {"COMPLETE": "summary_report"}
)

subgraph.add_edge("error_handler", "summary_report")
subgraph.add_edge("summary_report", END)

scrapper = subgraph.compile()

# Print the graph structure
try:
    print(scrapper.get_graph().draw_mermaid())
except:
    print("Could not draw mermaid diagram")


# Example Run (Success Path)
# print("\n========== RUN 1: SUCCESS ==========")
# inputs_success = {"messages": [HumanMessage(content="Find Data Scientist jobs in India")], "user_query": "Data Scientist jobs in India", "status": "INITIALIZE", "error_message": "", "raw_data": []}
# result_success = scrapper.invoke(inputs_success)
# print("\nFinal Result (Success):")
# print(f"Status: {result_success['status']}")
# print(f"Total Jobs Collected: {len(result_success['raw_data'])}")
# print(f"Last Message: {result_success['messages'][-1].content}")

# print("\n========== RUN 2: FAILURE ==========")
# inputs_fail = {"messages": [HumanMessage(content="Find fail_timesjob jobs")], "user_query": "fail_timesjob jobs", "status": "INITIALIZE", "error_message": "", "raw_data": []}
# result_fail = scrapper.invoke(inputs_fail)
# print("\nFinal Result (Failure):")
# print(f"Status: {result_fail['status']}")
# print(f"Total Jobs Collected: {len(result_fail['raw_data'])}")
# print(f"Last Message: {result_fail['messages'][-1].content}")
