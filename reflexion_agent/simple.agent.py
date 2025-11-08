from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain import hub
from langchain_tavily import TavilySearch
from langchain_fireworks import ChatFireworks
from dotenv import load_dotenv
import os

load_dotenv()

# Create tools
tools = [TavilySearch(max_results=2)]

# Get the prompt
prompt = hub.pull("hwchase17/openai-tools-agent")

# Create the agent
llm = ChatFireworks(model="accounts/fireworks/models/llama-v3p3-70b-instruct")
agent = create_tool_calling_agent(llm, tools, prompt)
agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

# Simple execution
response = agent_executor.invoke({
    "input": "Write about how small business can leverage AI to grow. Provide specific examples and search for current trends."
})

print(response["output"])