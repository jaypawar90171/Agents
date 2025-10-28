import os
import getpass
from dotenv import load_dotenv
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_fireworks import ChatFireworks

load_dotenv()

if not os.getenv("GOOGLE_API_KEY"):
    raise ValueError("GOOGLE_API_KEY not found. Check your .env file!")
if not os.getenv("TAVILY_API_KEY"):
    raise ValueError("TAVILY_API_KEY not found. Check your .env file!")
if not os.getenv("FIREWORKS_API_KEY"):
    raise ValueError("FIREWORKS_API_KEY not found. Check your .env file!")

# generation agent
geneartion_prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are an essay assistant tasked with writing excellent 5-paragraph essays."
            "Generate the best essay possible for the user's request."
            "If the user provides critique, respond with a revised version of your previous attempts.",
        ),
        MessagesPlaceholder(variable_name="messages")
    ]
)

llm = ChatFireworks(
    model="accounts/fireworks/models/llama-v3p3-70b-instruct"
)
generation_chain = geneartion_prompt | llm

# essay = ""
# request = HumanMessage(content="Write an essay on why the little prince is relevant in modern childhood")
# for chunk in generation_chain.stream({"messages": [request]}):
#     print(chunk.content, end="")
#     essay += chunk.content

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

# reflection = ""
# for chunk in reflection_chain.stream({"messages": [request, HumanMessage(content=essay)]}):
#     print(chunk.content, end="")
#     reflection += chunk.content