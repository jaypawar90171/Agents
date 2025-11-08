from pydantic import BaseModel, Field
from typing import List, Optional

class CodeReflection(BaseModel):
    time_complexity: str = Field(description="Analysis of time complexity")
    space_complexity: str = Field(description="Analysis of space complexity") 
    potential_bugs: str = Field(description="Potential edge cases and bugs")
    optimization_opportunities: str = Field(description="Areas for optimization")

class GenerateCode(BaseModel):
    """Generate code solution for the given problem."""
    problem_description: str = Field(description="Understanding of the problem")
    code: str = Field(description="Complete, runnable code solution")
    explanation: str = Field(description="Explanation of the approach")
    test_cases: List[str] = Field(description="2-3 test cases to verify the solution")
    search_queries: List[str] = Field(
        description="1-3 search queries for researching optimizations, best practices, or alternative approaches"
    )
    reflection: CodeReflection = Field(
        description="Technical analysis of the generated code")

class OptimizeCode(GenerateCode):
    """Optimize the code based on research and reflection."""
    
    improvements_made: List[str] = Field(
        description="Specific optimizations and improvements implemented"
    )
    before_after_comparison: str = Field(
        description="Comparison of time/space complexity before and after optimization"
    )