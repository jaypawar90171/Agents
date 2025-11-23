from typing import TypedDict, Annotated, Dict, Optional
from langgraph.graph import StateGraph, END, add_messages # type: ignore
from langchain_groq import ChatGroq # type: ignore
from langchain_tavily import TavilySearch # type: ignore
from langgraph.checkpoint.memory import MemorySaver # type: ignore
from langchain_core.messages import AIMessage, HumanMessage, ToolMessage, AIMessageChunk # type: ignore
from uuid import uuid4
from IPython.display import display, Image
from langchain_core.runnables.graph import MermaidDrawMethod # type: ignore
from dotenv import load_dotenv # type: ignore
from fastapi.middleware.cors import CORSMiddleware # type: ignore
from fastapi import FastAPI, Query # type: ignore
from fastapi.responses import StreamingResponse # type: ignore
import json
import asyncio

load_dotenv()

# Initialize LLM
llm = ChatGroq(
    model="llama-3.1-8b-instant",
    temperature=0.7,
    max_tokens=1024
)

# Create the search tool
search_tool = TavilySearch(
    max_results=3,
    include_raw_content=False,
    include_answer=True,
    search_depth="advanced"
)

tools = [search_tool]

# Memory for chat history
memory = MemorySaver()

# Bind tools to LLM
llm_with_tools = llm.bind_tools(tools=tools)


# TypedDict for graph state
class State(TypedDict):
    messages: Annotated[list, add_messages]


# LLM model node
async def model(state: State):
    result = await llm_with_tools.ainvoke(state["messages"])
    return {"messages": [result]}


# Router node — decides whether we need a tool call
async def tool_router(state: State):
    last_message = state["messages"][-1]

    if hasattr(last_message, "tool_calls") and len(last_message.tool_calls) > 0:
        return "tool_node"
    else:
        return END


# Custom tool node — executes tool calls
async def tool_node(state: State):
    tool_calls = state["messages"][-1].tool_calls
    tool_messages = []

    for tool_call in tool_calls:
        tool_name = tool_call["name"]
        tool_args = tool_call["args"]
        tool_id = tool_call["id"]

        # Handle Tavily search tool
        if tool_name == "tavily_search":
            search_results = await search_tool.ainvoke(tool_args)

            tool_message = ToolMessage(
                content=str(search_results),
                tool_call_id=tool_id,
                tool_name=tool_name
            )

            tool_messages.append(tool_message)

    return {"messages": tool_messages}


# Build the graph
graph_builder = StateGraph(State)
graph_builder.add_node("model", model)
graph_builder.add_node("tool_node", tool_node)
graph_builder.set_entry_point("model")

graph_builder.add_conditional_edges("model", tool_router)
graph_builder.add_edge("tool_node", "model")

graph = graph_builder.compile(checkpointer=memory)

app = FastAPI()

#add CORS middleware with settings that match frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def serialize_ai_message_chunk(chunk):
    if isinstance(chunk, AIMessageChunk):
        return chunk.content
    else:
        raise TypeError(
            f"object of type {type(chunk).__name__} is not correctly formatted  for serialization"
        )

async def generate_chat_response(message: str, checkpoint_id: Optional[str] = None):
    is_new_conversation = checkpoint_id is None

    if is_new_conversation:
        #Generate new checkpoint ID for first message in Conversation
        new_checkpoint_id = str(uuid4())

        config = {
            "configurable": {
                "thread_id": new_checkpoint_id
            }
        }

        #Initialize with new message
        events = graph.astream_events(
            {"messages": [HumanMessage(content=message)]},
            config=config,
            version="v2"
        )

        #First send the checkpoint ID to the client
        yield f"data: {{\"type\": \"checkpoint_id\", \"data\": \"{new_checkpoint_id}\"}}\n\n"
    
    else:
        config = {
            "configurable": {
                "thread_id": checkpoint_id
            }
        }

        #Continue existing conversation
        events = graph.astream_events(
            {"messages": [HumanMessage(content=message)]},
            config=config,
            version="v2"
        )

    async for event in events:
        event_type = event["event"]

        if event_type == "on_chat_model_stream":
            chunk_content = serialize_ai_message_chunk(event["data"]["chunk"])

            #Escape single quotes in chunk content for safe JSON transmission
            safe_content = chunk_content.replace("'", "\\'").replace("\n", "\\n")
            yield f"data: {{\"type\": \"chat_chunk\", \"data\": \"{safe_content}\"}}\n\n"

        elif event_type == "on_chat_model_end":
            #Check if there are tool calls for seacrh queries
            tool_calls = event["data"]["output"].tool_calls if hasattr(event["data"]["output"], "tool_calls" ) else []
            search_calls = [call for call in tool_calls if call["name"] == "tavily_search"]

            if search_calls:
                #Signal to the cliemt that search is being performed
                search_query = search_calls[0]["args"].get("query", "")
                #Escape single quotes and special characters
                safe_query = search_query.replace("'", "\\'").replace("\n", "\\n")
                yield f"data: {{\"type\": \"search_start\", \"data\": \"{safe_query}\"}}\n\n"

        elif event_type == "on_tool_end" and event["name"] == "tavily_search":
            #Send search results to client either results or no results found
            output = event["data"]["output"]

            #Check if output is a list
            if isinstance(output, dict) and "results" in output:
                #Extreact url from each search result
                urls = []
                for item in output["results"]:
                    if isinstance(item, dict) and "url" in item:
                        urls.append(item["url"])

                #Convert urls to json and yeild to client
                if urls:
                    urls_json = json.dumps(urls)
                    yield f"data: {{\"type\": \"search_results\", \"data\": {urls_json}}}\n\n"

    #Send an end  event
    yield f"data: {{\"type\": \"end\"}}\n\n"

# Define the chat streaming endpoint
@app.get("/chat_stream/{message}")
async def chat_stream(message: str, checkpoint_id: Optional[str] = Query(None)):
    return StreamingResponse(
        generate_chat_response(message, checkpoint_id),
        media_type="text/event-stream"
    )