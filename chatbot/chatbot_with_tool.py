from typing import TypedDict, Annotated
from langgraph.graph import add_messages, END, StateGraph
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, AIMessage
from langchain_tavily import TavilySearch
from langgraph.prebuilt import ToolNode
from dotenv import load_dotenv

load_dotenv()

class ChatbotState(TypedDict):
    messages: Annotated[list, add_messages]

# Define the tools for the chatbot
search_tool = TavilySearch(max_results=2)
tools = [search_tool]

llm = ChatGroq(model="llama-3.1-8b-instant")
llm_with_tools = llm.bind_tools(tools)

# Define the chatbot node
def chatbot(state: ChatbotState):
    response = llm_with_tools.invoke(state["messages"])
    return {"messages": [response]}

def execute_tool(state: ChatbotState):
    last_message = state["messages"][-1]

    if hasattr(last_message, "tool_calls") and len(last_message.tool_calls) > 0:
        return "tool_node"
    else:
        return END  

tool_node = ToolNode(tools=tools)

graph = StateGraph(ChatbotState)

graph.add_node("chatbot", chatbot)
graph.add_node("tool_node", tool_node)
graph.set_entry_point("chatbot")
graph.add_conditional_edges("chatbot", execute_tool)
graph.add_edge("tool_node", "chatbot")

app = graph.compile()

while True: 
    user_input = input("User: ")
    if user_input in ["exit", "end"]:
        break
    else: 
        result = app.invoke({
            "messages": [HumanMessage(content=user_input)]
        })

        print("Assistant:", result["messages"][-1].content)