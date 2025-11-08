from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_fireworks import ChatFireworks
import datetime
from langchain_core.output_parsers import JsonOutputParser
from langchain.schema import HumanMessage
from schema import GenerateCode, OptimizeCode
from dotenv import load_dotenv
import os
import json

load_dotenv()

if not os.getenv("FIREWORKS_API_KEY"):
    raise ValueError("FIREWORKS_API_KEY not found. Check your .env file!")

# Create JSON parsers for our schemas
code_parser = JsonOutputParser(pydantic_object=GenerateCode)
optimize_parser = JsonOutputParser(pydantic_object=OptimizeCode)

# Coding Assistant Prompt Template
coder_prompt_template = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """You are an expert software engineer and coding assistant. Current time is {time}.
            
1. {first_instruction}
2. Analyze your solution for:
   - Time and space complexity
   - Potential bugs and edge cases  
   - Optimization opportunities
3. Provide 2-3 test cases to verify correctness
4. Suggest 1-3 search queries for researching optimizations or best practices

Output ONLY a valid JSON object that conforms to the following schema without any additional text or explanations:

{format_instructions}
"""),
        MessagesPlaceholder(variable_name="messages"), 
    ]
).partial(time=lambda: datetime.datetime.now().isoformat())

# LLM Configuration
llm = ChatFireworks(
    model="accounts/fireworks/models/llama-v3p3-70b-instruct",
    temperature=0.1
)

# Initial Code Generator Chain
code_generator_prompt = coder_prompt_template.partial(
    first_instruction="""Understand the coding problem and provide a complete, runnable solution.
- Write clean, efficient, well-commented code
- Include proper error handling
- Consider edge cases""",
    format_instructions=code_parser.get_format_instructions()
)

code_generator_chain = code_generator_prompt | llm

# Code Optimizer Chain
optimize_instructions = """Optimize the previous code solution using research findings and your technical analysis.
- Implement performance improvements
- Fix potential bugs and edge cases
- Apply best practices and coding standards
- Maintain or improve readability
- Document the optimizations made"""

code_optimizer_prompt = coder_prompt_template.partial(
    first_instruction=optimize_instructions,
    format_instructions=optimize_parser.get_format_instructions()
)

code_optimizer_chain = code_optimizer_prompt | llm