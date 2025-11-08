import json
from typing import List, Dict, Any
from langchain_tavily import TavilySearch
from langchain_core.messages import BaseMessage, AIMessage, ToolMessage, HumanMessage

# Create a tavily search tool to search the web for information
search_tool = TavilySearch(max_results=2)  # Reduced for testing

# Function to execute search queries from AnswerQuestion tool calls
def execute_tool(state: List[BaseMessage]) -> List[BaseMessage]:
    # Find the last AI message
    last_ai_message = None
    for msg in reversed(state):
        if isinstance(msg, AIMessage):
            last_ai_message = msg
            break
    
    if not last_ai_message:
        print("No AI message found")
        return []

    print(f"Processing AI message: {last_ai_message.content[:100] if last_ai_message.content else 'No content'}")

    # For simple text responses, try to extract search queries from content
    tools_messages = []
    
    if last_ai_message.content:
        try:
            # Try to parse the content as JSON
            content_data = json.loads(last_ai_message.content)
            search_queries = content_data.get("search_queries", [])
            
            if search_queries:
                query_result = {}
                for query in search_queries:
                    try:
                        print(f"Searching for: {query}")
                        result = search_tool.invoke(query)
                        query_result[query] = result
                    except Exception as e:
                        query_result[query] = f"Error searching: {str(e)}"
                
                # Create a tool message with the results
                tools_messages.append(ToolMessage(
                    content=json.dumps(query_result), 
                    tool_call_id="search_call_1"
                ))
        except json.JSONDecodeError:
            print("Content is not JSON, skipping tool execution")
    
    return tools_messages