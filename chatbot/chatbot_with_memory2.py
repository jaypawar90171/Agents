from typing import TypedDict, Annotated
from langgraph.graph import add_messages, END, StateGraph
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_tavily import TavilySearch
from langgraph.prebuilt import ToolNode
from langgraph.checkpoint.memory import MemorySaver
from dotenv import load_dotenv
import uuid

load_dotenv()

# Initialize memory checkpointer
memory = MemorySaver()

# Define state structure
class ChatbotState(TypedDict):
    messages: Annotated[list, add_messages]

# Configure tools
search_tool = TavilySearch(
    max_results=2,
    include_raw_content=False,
    include_answer=True,
    search_depth="advanced"
)
tools = [search_tool]

# Initialize LLM with tools
llm = ChatGroq(
    model="llama-3.1-8b-instant",
    temperature=0.7,
    max_tokens=1024
)
llm_with_tools = llm.bind_tools(tools)

# System prompt for the chatbot
SYSTEM_PROMPT = """You are a helpful AI assistant with access to web search capabilities. 

                Guidelines:
                - Use web search when you need current information, recent events, or facts you're uncertain about
                - Provide clear, concise, and accurate responses
                - Cite your sources when using search results
                - Be conversational and friendly
                - If you don't know something and search doesn't help, admit it honestly"""

def chatbot(state: ChatbotState):
    """Main chatbot node that processes messages and decides whether to use tools"""
    messages = state["messages"]
    if not any(isinstance(msg, SystemMessage) for msg in messages):
        messages = [SystemMessage(content=SYSTEM_PROMPT)] + messages
    
    response = llm_with_tools.invoke(messages)
    return {"messages": [response]}

def should_continue(state: ChatbotState):
    """Conditional edge function to determine next step"""
    last_message = state["messages"][-1]
    
    # Check if the last message has tool calls
    if hasattr(last_message, "tool_calls") and len(last_message.tool_calls) > 0:
        return "tools"
    else:
        return END

# Initialize tool node
tool_node = ToolNode(tools=tools)

# Build the graph
graph = StateGraph(ChatbotState)

# Add nodes
graph.add_node("agent", chatbot)
graph.add_node("tools", tool_node)

# Set entry point
graph.set_entry_point("agent")

# Add edges
graph.add_conditional_edges(
    "agent",
    should_continue,
    {
        "tools": "tools",
        END: END
    }
)
graph.add_edge("tools", "agent")

# Compile with memory
app = graph.compile(checkpointer=memory)

def run_chatbot():
    """Main function to run the chatbot"""
    print("=== AI Chatbot with Memory & Web Search ===")
    print("Type 'exit', 'quit', or 'end' to stop")
    print("Type 'new' to start a new conversation")
    print("=" * 45)
    
    # Generate or use existing thread_id for conversation persistence
    thread_id = str(uuid.uuid4())
    
    while True:
        try:
            user_input = input("\nYou: ").strip()
            
            if not user_input:
                continue
                
            if user_input.lower() in ["exit", "quit", "end"]:
                print("\nGoodbye!")
                break
            
            if user_input.lower() == "new":
                thread_id = str(uuid.uuid4())
                print(f"\nStarted new conversation (Thread: {thread_id[:8]}...)")
                continue
            
            # Configuration with thread_id for memory persistence
            config = {"configurable": {"thread_id": thread_id}}
            
            # Invoke the graph with the user input
            result = app.invoke(
                {"messages": [HumanMessage(content=user_input)]},
                config=config
            )
            
            # Extract and display the assistant's response
            assistant_message = result["messages"][-1]
            
            print(f"\n Assistant: {assistant_message.content}")
            
            # Optionally show if tools were used
            if hasattr(assistant_message, "tool_calls") and assistant_message.tool_calls:
                print(f"   [Used tools: {', '.join([tc['name'] for tc in assistant_message.tool_calls])}]")
        
        except KeyboardInterrupt:
            print("\n\n Goodbye!")
            break
        except Exception as e:
            print(f"\n Error: {str(e)}")
            print("Please try again.")

if __name__ == "__main__":
    run_chatbot()