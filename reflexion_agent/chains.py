from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_fireworks import ChatFireworks
import datetime
from langchain_core.output_parsers import JsonOutputParser
from langchain.schema import HumanMessage
from schema import AnswerQuestion, ReviseAnswer
from dotenv import load_dotenv
import os
import json

load_dotenv()

if not os.getenv("FIREWORKS_API_KEY"):
    raise ValueError("FIREWORKS_API_KEY not found. Check your .env file!")

# Create JSON parsers for our schemas
answer_parser = JsonOutputParser(pydantic_object=AnswerQuestion)
revise_parser = JsonOutputParser(pydantic_object=ReviseAnswer)

# Actor Agent Prompt - Defines how AI will respond to the user's request
actor_prompt_template = ChatPromptTemplate.from_messages(
    [
        (
            "system",  # AI's behavior description
            """You are an expert AI researcher that can perform a task based on the user's request. Current time is {time}.
            1. {first_instruction}  
            2. Reflect and critique your answer based on the user's request and the current time. Be severe to maximize the improvement. Provide critiques for what is missing and what is superfluous.
            3. After the reflection, **list 1-3 search queries separately** based on the user's request for researching improvements. Do not include them inside the reflection.
            
            Output ONLY a valid JSON object that conforms to the following schema without any additional text or explanations:
            
            {format_instructions}
            """),
        MessagesPlaceholder(variable_name="messages"), 
    ]
).partial(time=lambda: datetime.datetime.now().isoformat())

# LLM - The model that will be used to generate the response
llm = ChatFireworks(
    model="accounts/fireworks/models/llama-v3p3-70b-instruct",
    temperature=0.1  # Lower temperature for more consistent JSON output
)

first_responder_prompt_template = actor_prompt_template.partial(
    first_instruction="Provide a detailed 250 word answer to the user's question.",
    format_instructions=answer_parser.get_format_instructions()
)

# Alternative approach: Use function/tool calling properly
def create_tool_message(tool_name, content):
    """Create a properly formatted tool message"""
    return {
        "type": "tool_call",
        "name": tool_name,
        "args": content
    }

# First responder chain - using proper tool binding
first_responder_chain = first_responder_prompt_template | llm

# Revisor Agent Chain
revise_instructions = """Revise your previous answer using the new information.
    - You should use the previous critique to add important information to your answer.
    - You MUST include numerical citations in your revised answer to ensure it can be verified.
    - Add a "References" section to the bottom of your answer (which does not count towards the word limit). In form of:
        - [1] https://example.com
        - [2] https://example.com
    - You should use the previous critique to remove superfluous information from your answer and make SURE it is not more than 250 words.
"""

revisor_prompt_template = actor_prompt_template.partial(
    first_instruction=revise_instructions,
    format_instructions=revise_parser.get_format_instructions()
)

revisor_chain = revisor_prompt_template | llm

# Simple test function to verify the chain works
def test_chain():
    response = first_responder_chain.invoke({
        "messages": [HumanMessage(content="Write a small blog post about how small businesses can use AI to improve their operations")]
    })
    print("Test response:", response)
    return response

# Only run test if this file is executed directly
if __name__ == "__main__":
    test_chain()