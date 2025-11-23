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

#child graph
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

def agent(state: childState):
    return {
        "messages": [llm_with_tools.invoke(state["messages"])]
    }

def tool_router(state: childState):
    last_message = state["messages"][-1]

    if(hasattr(last_message, "tool_calls") and len(last_message.tool_calls) > 0):
        return "tool_node"
    else:
        return END
    
tool_node = ToolNode(tools=tools)

subgraph = StateGraph(childState)

subgraph.add_node("agent", agent)
subgraph.add_node("tool_node", tool_node)
subgraph.set_entry_point("agent")

subgraph.add_conditional_edges("agent", tool_router)
subgraph.add_edge("tool_node", "agent")


search_app = subgraph.compile()

display(
    Image(
        search_app.get_graph().draw_mermaid_png(draw_method=MermaidDrawMethod.API)
    )
)

#test the subgraph
# response = search_app.invoke({
#     "messages": [HumanMessage(content="How is whether in Chennai?")]
# })

# print(response)



# CASE 1: Shared Schema (Direct Embedding)

#parent graph with same schema
# class ParentState(TypedDict):
#     messages: Annotated[list, add_messages]

# parent_graph = StateGraph(ParentState)

# #add a subgraph as a node
# parent_graph.add_node("search_agent", search_app)

# #Connect the flow
# parent_graph.add_edge(START, "search_agent")
# parent_graph.add_edge("search_agent", END)

# #compile the parent graph
# parent_app = parent_graph.compile()

# #run the parent graph
# result = parent_app.invoke({
#     "messages": [HumanMessage(content="How is whether in Chennai?")]
# })

# print(result)



# CASE 2: Different Schema (Invoke with Transformation)

#Define the parent graph with different schema
class QueryState(TypedDict):
    query: str
    response: str

#Function to invoke subgraph
def search_agent(state: QueryState) -> Dict:

    #Transform yhe parent schema to subgraph schema
    subgraph_input = {
        "messages": [HumanMessage(content=state["query"])]
    }

    #Invoke the subgraph
    subgraph_result = search_app.invoke(subgraph_input)

    #Tranform response back to parent schema
    assistant_message = subgraph_result["messages"][-1]
    return {"response": assistant_message.content}

#Create the parent graph
parent_graph2 = StateGraph(QueryState)

#Add transformation node that invoke subgraph
parent_graph2.add_node("search_agent", search_agent)

#Connect the flow
parent_graph2.add_edge(START, "search_agent")
parent_graph2.add_edge("search_agent", END)

#compile the parent graph
parent_app2 = parent_graph2.compile()

#run the parent graph
result2 = parent_app2.invoke({
    "query": "How is Today's whether in Chennai?",
    "response": ""
})

print(result2)