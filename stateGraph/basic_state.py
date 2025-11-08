from typing import TypedDict
from langgraph.graph import StateGraph, START, END

class SimpleState(TypedDict):
    count: int

def increment_count(state: SimpleState) -> SimpleState:
    return {
        "count": state["count"] + 1
    }

def  should_continue(state):
    if state["count"] < 10:
        return "continue"
    else:
        return "stop"

graph = StateGraph(SimpleState)

graph.add_node("increment_count", increment_count)
graph.set_entry_point("increment_count")
graph.add_conditional_edges(
    "increment_count", 
    should_continue,
    {
        "continue": "increment_count",
        "stop": END
    }
)

app = graph.compile()
print(app.get_graph().draw_mermaid())
result = app.invoke({"count": 0})
print(result)