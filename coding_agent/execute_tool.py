import json
from typing import List
from langchain_tavily import TavilySearch
from langchain_core.messages import BaseMessage, AIMessage, ToolMessage, HumanMessage

# Create search tools
search_tool = TavilySearch(max_results=3)

def execute_tool(state: List[BaseMessage]) -> List[BaseMessage]:
    """Execute search queries for coding optimizations and best practices"""
    
    # Find the last AI message
    last_ai_message = None
    for msg in reversed(state):
        if isinstance(msg, AIMessage):
            last_ai_message = msg
            break
    
    if not last_ai_message:
        return []

    tools_messages = []
    
    if last_ai_message.content:
        try:
            # Parse the content to extract search queries
            content_data = json.loads(last_ai_message.content)
            search_queries = content_data.get("search_queries", [])
            
            if search_queries:
                query_result = {}
                for query in search_queries:
                    try:
                        print(f"🔍 Searching for: {query}")
                        result = search_tool.invoke(query)
                        query_result[query] = result
                    except Exception as e:
                        query_result[query] = f"Error searching: {str(e)}"
                
                # Create tool message with search results
                tools_messages.append(ToolMessage(
                    content=json.dumps(query_result), 
                    tool_call_id="code_search_1"
                ))
        except json.JSONDecodeError:
            print("Content is not JSON, looking for alternative patterns")
    
    return tools_messages