from typing import List, Dict, Any
from langchain_core.messages import BaseMessage, ToolMessage, HumanMessage, AIMessage
from langgraph.graph import END, MessageGraph, StateGraph
from chains import first_responder_chain, revisor_chain
from execute_tool import execute_tool
import json

graph = MessageGraph()
MAX_ITERATIONS = 2

def draft_node(state: List[BaseMessage]) -> List[BaseMessage]:
    """Process the initial draft"""
    response = first_responder_chain.invoke({"messages": state})
    return [response]

def revisor_node(state: List[BaseMessage]) -> List[BaseMessage]:
    """Process revision"""
    response = revisor_chain.invoke({"messages": state})
    return [response]

graph.add_node("draft", draft_node)
graph.add_node("execute_tool", execute_tool)
graph.add_node("revisor", revisor_node)

graph.add_edge("draft", "execute_tool")
graph.add_edge("execute_tool", "revisor")

def event_loop(state: List[BaseMessage]) -> str:
    count_tool_visits = sum(isinstance(item, ToolMessage) for item in state)
    num_iterations = count_tool_visits
    if num_iterations >= MAX_ITERATIONS:
        return END
    return "execute_tool"

graph.add_conditional_edges("revisor", event_loop)
graph.set_entry_point("draft")

app = graph.compile()

# Print the graph structure
try:
    print(app.get_graph().draw_mermaid())
except:
    print("Could not draw mermaid diagram")

# Invoke the graph with proper error handling
try:
    response = app.invoke(
        [HumanMessage(content="Write about how small business can leverage AI to grow")]
    )
    
    # Extract and print the final answer
    print("\n=== FINAL RESPONSE ===")
    for msg in response:
        if isinstance(msg, AIMessage):
            print("AI Message:", msg.content)
        elif isinstance(msg, ToolMessage):
            print("Tool Message:", msg.content[:200] + "..." if len(msg.content) > 200 else msg.content)
        elif isinstance(msg, HumanMessage):
            print("Human Message:", msg.content)
            
except Exception as e:
    print(f"Error during graph execution: {e}")
    import traceback
    traceback.print_exc()