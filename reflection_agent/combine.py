import os
import getpass
from typing import List, Sequence, TypedDict
from dotenv import load_dotenv
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_fireworks import ChatFireworks
from langgraph.graph import END, StateGraph

load_dotenv()

# Environment variable checks
if not os.getenv("GOOGLE_API_KEY"):
    raise ValueError("GOOGLE_API_KEY not found. Check your .env file!")
if not os.getenv("TAVILY_API_KEY"):
    raise ValueError("TAVILY_API_KEY not found. Check your .env file!")
if not os.getenv("FIREWORKS_API_KEY"):
    raise ValueError("FIREWORKS_API_KEY not found. Check your .env file!")

# Define State
class GraphState(TypedDict):
    messages: List[BaseMessage]

# Generation agent
generation_prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are an essay assistant tasked with writing excellent 2-paragraph essays."
            "Generate the best essay possible for the user's request."
            "If the user provides critique, respond with a revised version of your previous attempts.",
        ),
        MessagesPlaceholder(variable_name="messages")
    ]
)

llm = ChatFireworks(
    model="accounts/fireworks/models/llama-v3p3-70b-instruct"
)
generation_chain = generation_prompt | llm

# Reflection agent
reflection_prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a teacher grading an essay submission. Generate critique and recommendations for the user's submission."
            " Provide detailed recommendations, including requests for length, depth, style, etc.",
        ),
        MessagesPlaceholder(variable_name="messages"),
    ]
)

reflection_chain = reflection_prompt | llm

REFLECT = "reflect"
GENERATE = "generate"

graph_builder = StateGraph(GraphState)

# Create the generation node
def generate_node(state: GraphState):
    response = generation_chain.invoke({
        "messages": state["messages"]
    })
    return {"messages": state["messages"] + [response]}

# Create the reflection node
def reflect_node(state: GraphState):
    response = reflection_chain.invoke({
        "messages": state["messages"]
    })
    return {"messages": state["messages"] + [HumanMessage(content=response.content)]}

graph_builder.add_node(GENERATE, generate_node)
graph_builder.add_node(REFLECT, reflect_node)

graph_builder.set_entry_point(GENERATE)

def should_continue(state: GraphState):
    ai_messages = [msg for msg in state["messages"] if isinstance(msg, AIMessage)]
    if len(ai_messages) >= 2:  
        return END
    return REFLECT

graph_builder.add_conditional_edges(
    GENERATE, 
    should_continue,
    {
        REFLECT: REFLECT,
        END: END
    }
)
graph_builder.add_edge(REFLECT, GENERATE)

app = graph_builder.compile()

print("Mermaid Diagram:")
print(app.get_graph().draw_mermaid())

print("\nASCII Diagram:")
app.get_graph().print_ascii()

response = app.invoke({
    "messages": [HumanMessage(content="Write an essay about the benefits of learning programming.")]
})

print("\nFinal Response:")
print(response)

