from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv
from langchain.agents import AgentExecutor, create_tool_calling_agent, tool
from langchain_core.prompts import ChatPromptTemplate
from langchain_tavily import TavilySearch
import os
import datetime

load_dotenv()

if not os.getenv("GOOGLE_API_KEY"):
    raise ValueError("GOOGLE_API_KEY not found. Check your .env file!")
if not os.getenv("TAVILY_API_KEY"):
    raise ValueError("TAVILY_API_KEY not found. Check your .env file!")

llm = ChatGoogleGenerativeAI(model="gemini-pro-latest")

@tool
def get_system_date(format: str = "%Y-%m-%d %H:%M:%S"):
    """Returns the current date and time"""
    current_time = datetime.datetime.now()
    formmatted_time = current_time.strftime(format)
    return formmatted_time

tools = [TavilySearch(max_results=2), get_system_date]

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful assistant."),
    ("human", "{input}"),
    ("placeholder", "{agent_scratchpad}"),
])

agent = create_tool_calling_agent(llm, tools, prompt)
agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

response = agent_executor.invoke({
    "input": "when was spaceX's last launch and how many days ago was that from this instant"
})

print("\n🔹 Response:\n", response["output"])