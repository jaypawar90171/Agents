import operator
from typing import List, Annotated
from typing_extensions import TypedDict
from dotenv import load_dotenv
from langchain_core.messages import BaseMessage, HumanMessage
from langgraph.graph import END, StateGraph
from chains import generation_chain, reflection_chain

load_dotenv()
REFLECT = "reflect"
GENERATE = "generate"

# --- 1. Define the State ---
class AgentState(TypedDict):
    messages: Annotated[List[BaseMessage], operator.add]


# --- 2. Define the Nodes ---
def generate_node(state: AgentState):
    """Generates the essay."""
    print("--- Executing GENERATE node ---")
    messages = state['messages'] 
    response = generation_chain.invoke({"messages": messages})
    return {"messages": [response]}

def reflect_node(state: AgentState):
    """Reflects on the generated essay."""
    print("--- Executing REFLECT node ---")
    messages = state['messages']
    response = reflection_chain.invoke({"messages": messages})
    return {"messages": [HumanMessage(content=response.content)]}


# --- 3. Define the Conditional Logic ---
def should_continue(state: AgentState):
    """Determines whether to reflect or end."""
    print("--- Executing should_continue ---")
    
    if len(state['messages']) > 3:
        print("--- Condition MET: Routing to END ---")
        return END
    else:
        print("--- Condition NOT MET: Routing to REFLECT ---")
        return REFLECT

# --- 4. Construct the Graph ---
graph = StateGraph(AgentState)

# Add the nodes
graph.add_node(GENERATE, generate_node)
graph.add_node(REFLECT, reflect_node)

# Set the entry point
graph.set_entry_point(GENERATE)

# 
# THIS IS THE LINE THAT IS WRONG IN YOUR FILE
# 
# This line creates the conditional branch you see in the image
graph.add_conditional_edges(
    GENERATE,
    should_continue
)

# Add the loop
graph.add_edge(REFLECT, GENERATE)

# Compile the graph
app = graph.compile()

# Print the graph visualizations
print(f"\n--- MERMAID DIAGRAM (StateGraph) ---")
print(app.get_graph().draw_mermaid())
print(f"\n--- ASCII DIAGRAM (StateGraph) ---")
app.get_graph().print_ascii()