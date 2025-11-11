from typing import TypedDict, Annotated
from langgraph.graph import add_messages, END, StateGraph
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_tavily import TavilySearch
from langgraph.prebuilt import ToolNode
from langgraph.checkpoint.sqlite import SqliteSaver
from dotenv import load_dotenv
import sqlite3
import uuid
import os
import json

load_dotenv()

# Initialize memory checkpointer
sqlite_conn = sqlite3.connect("checkpoint.sqlite", check_same_thread=False)
memory = SqliteSaver(sqlite_conn)

# File to store the current thread_id
THREAD_FILE = "current_thread.json"

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

def load_thread_id():
    """Load the last used thread_id from file"""
    if os.path.exists(THREAD_FILE):
        try:
            with open(THREAD_FILE, 'r') as f:
                data = json.load(f)
                return data.get('thread_id')
        except:
            pass
    return None

def save_thread_id(thread_id):
    """Save the current thread_id to file"""
    with open(THREAD_FILE, 'w') as f:
        json.dump({'thread_id': thread_id}, f)

def list_conversations():
    """List all available conversation threads"""
    try:
        cursor = sqlite_conn.cursor()
        cursor.execute("SELECT DISTINCT thread_id FROM checkpoints")
        threads = cursor.fetchall()
        return [thread[0] for thread in threads]
    except:
        return []

def get_conversation_preview(thread_id, limit=3):
    """Get a preview of the last few messages in a conversation"""
    try:
        config = {"configurable": {"thread_id": thread_id}}
        state = app.get_state(config)
        if state and state.values.get("messages"):
            messages = state.values["messages"]
            # Get last few messages (excluding system messages)
            user_messages = [m for m in messages if isinstance(m, HumanMessage)]
            return user_messages[-limit:] if user_messages else []
    except:
        pass
    return []

def run_chatbot():
    """Main function to run the chatbot"""
    print("=" * 50)
    print("  AI Chatbot with Persistent Memory & Web Search")
    print("=" * 50)
    
    # Try to load the last thread_id
    thread_id = load_thread_id()
    
    if thread_id:
        print(f"\n Found previous conversation (Thread: {thread_id[:8]}...)")
        
        # Show preview of last conversation
        preview = get_conversation_preview(thread_id, limit=2)
        if preview:
            print("\n Last messages:")
            for msg in preview:
                print(f"   You: {msg.content[:60]}{'...' if len(msg.content) > 60 else ''}")
        
        resume = input("\n Resume this conversation? (y/n): ").strip().lower()
        if resume != 'y':
            thread_id = str(uuid.uuid4())
            save_thread_id(thread_id)
            print(f"\n Started new conversation (Thread: {thread_id[:8]}...)")
        else:
            print("\n Resuming previous conversation...")
    else:
        thread_id = str(uuid.uuid4())
        save_thread_id(thread_id)
        print(f"\n Started new conversation (Thread: {thread_id[:8]}...)")
    
    print("\nCommands:")
    print("  'new'   - Start a new conversation")
    print("  'list'  - List all conversations")
    print("  'exit'  - Quit the chatbot")
    print("-" * 50)
    
    while True:
        try:
            user_input = input("\n You: ").strip()
            
            if not user_input:
                continue
                
            if user_input.lower() in ["exit", "quit", "end"]:
                print("\n Goodbye! Your conversation has been saved.")
                break
            
            if user_input.lower() == "new":
                thread_id = str(uuid.uuid4())
                save_thread_id(thread_id)
                print(f"\n Started new conversation (Thread: {thread_id[:8]}...)")
                continue
            
            if user_input.lower() == "list":
                threads = list_conversations()
                if threads:
                    print(f"\nFound {len(threads)} conversation(s):")
                    for i, tid in enumerate(threads[-5:], 1):  # Show last 5
                        preview = get_conversation_preview(tid, limit=1)
                        preview_text = preview[0].content[:40] if preview else "No messages"
                        current = " (current)" if tid == thread_id else ""
                        print(f"   {i}. {tid[:8]}... - {preview_text}...{current}")
                    
                    switch = input("\nSwitch to a conversation? (enter number or 'n'): ").strip()
                    if switch.isdigit() and 1 <= int(switch) <= len(threads[-5:]):
                        thread_id = threads[-5:][int(switch) - 1]
                        save_thread_id(thread_id)
                        print(f"\nSwitched to conversation {thread_id[:8]}...")
                else:
                    print("\nNo conversations found.")
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
            
            print(f"\nAssistant: {assistant_message.content}")
            
            # Optionally show if tools were used
            if hasattr(assistant_message, "tool_calls") and assistant_message.tool_calls:
                print(f"   [Used tools: {', '.join([tc['name'] for tc in assistant_message.tool_calls])}]")
        
        except KeyboardInterrupt:
            print("\n\nGoodbye! Your conversation has been saved.")
            break
        except Exception as e:
            print(f"\nError: {str(e)}")
            print("Please try again.")

if __name__ == "__main__":
    run_chatbot()