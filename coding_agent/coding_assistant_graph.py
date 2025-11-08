from typing import List
from langchain_core.messages import BaseMessage, ToolMessage, HumanMessage, AIMessage
from langgraph.graph import END, MessageGraph, StateGraph
from chains import code_generator_chain, code_optimizer_chain
from execute_tool import execute_tool
import json

# Create the graph
graph = MessageGraph()
MAX_ITERATIONS = 2

def code_generator_node(state: List[BaseMessage]) -> List[BaseMessage]:
    """Generate initial code solution"""
    response = code_generator_chain.invoke({"messages": state})
    return [response]

def code_optimizer_node(state: List[BaseMessage]) -> List[BaseMessage]:
    """Optimize code based on research and reflection"""
    response = code_optimizer_chain.invoke({"messages": state})
    return [response]

# Add nodes to graph
graph.add_node("generate_code", code_generator_node)
graph.add_node("execute_tool", execute_tool)
graph.add_node("optimize_code", code_optimizer_node)

# Define edges
graph.add_edge("generate_code", "execute_tool")
graph.add_edge("execute_tool", "optimize_code")

def optimization_loop(state: List[BaseMessage]) -> str:
    """Determine whether to continue optimizing"""
    count_tool_visits = sum(isinstance(item, ToolMessage) for item in state)
    num_iterations = count_tool_visits
    
    # Check if we should continue optimizing
    if num_iterations >= MAX_ITERATIONS:
        return END
    
    # Check if the last message indicates further optimization is needed
    last_ai_message = None
    for msg in reversed(state):
        if isinstance(msg, AIMessage):
            last_ai_message = msg
            break
    
    if last_ai_message and last_ai_message.content:
        try:
            content_data = json.loads(last_ai_message.content)
            reflection = content_data.get("reflection", {})
            optimization_opps = reflection.get("optimization_opportunities", "")
            
            # If there are still optimization opportunities, continue
            if optimization_opps and "no major" not in optimization_opps.lower():
                return "execute_tool"
        except:
            pass
    
    return END

graph.add_conditional_edges("optimize_code", optimization_loop)
graph.set_entry_point("generate_code")

# Compile the application
app = graph.compile()

def run_coding_assistant(problem_statement: str):
    """Run the coding assistant with a given problem"""
    print(f"Problem: {problem_statement}")
    print("=" * 60)
    
    try:
        response = app.invoke(
            [HumanMessage(content=problem_statement)]
        )
        
        # Extract and display the final optimized solution
        print("\nFINAL OPTIMIZED SOLUTION")
        print("=" * 60)
        
        for msg in reversed(response):
            if isinstance(msg, AIMessage) and msg.content:
                try:
                    data = json.loads(msg.content)
                    
                    if "code" in data:
                        print(f"\nProblem Understanding:")
                        print(data.get("problem_description", "N/A"))
                        
                        print(f"\nOptimized Code:")
                        print(data["code"])
                        
                        print(f"\nExplanation:")
                        print(data.get("explanation", "N/A"))
                        
                        print(f"\nTest Cases:")
                        for i, test_case in enumerate(data.get("test_cases", []), 1):
                            print(f"{i}. {test_case}")
                        
                        if "improvements_made" in data:
                            print(f"\nImprovements Made:")
                            for imp in data["improvements_made"]:
                                print(f"  • {imp}")
                            
                            print(f"\nComplexity Comparison:")
                            print(data.get("before_after_comparison", "N/A"))
                        
                        print(f"\nTechnical Analysis:")
                        reflection = data.get("reflection", {})
                        print(f"   Time Complexity: {reflection.get('time_complexity', 'N/A')}")
                        print(f"   Space Complexity: {reflection.get('space_complexity', 'N/A')}")
                        print(f"   Potential Bugs: {reflection.get('potential_bugs', 'N/A')}")
                        
                        break
                        
                except json.JSONDecodeError:
                    print("Raw AI Message:", msg.content)
        
        return response
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

# Example usage
if __name__ == "__main__":
    problem = "Write a C++ program for the following problem: Alice has n balloons tied to a rope. Each balloon has a color represented by a string colors, where colors[i] is the color of the i-th balloon. Alice wants the rope to be colorful, meaning no two consecutive balloons should have the same color. Bob can remove some balloons to achieve this. The time required to remove the i-th balloon is given by an array neededTime, where neededTime[i] represents the number of seconds needed to remove that balloon. Your task is to find the minimum total time Bob needs to remove balloons so that no two consecutive balloons have the same color."
    
    run_coding_assistant(problem)