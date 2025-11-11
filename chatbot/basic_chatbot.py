from typing import TypedDict, Annotated
#add_messages is designed to intelligently merge messages into a state's message list, rather than simply replacing the entire list. This is crucial for conversational AI applications where you need to maintain message history.
from langgraph.graph import add_messages, END, StateGraph
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, AIMessage
from dotenv import load_dotenv

load_dotenv()

llm = ChatGroq(model="llama-3.1-8b-instant")
 
#define the state of the chatbot
class ChatbotState(TypedDict):
    messages: Annotated[list, add_messages]

#define the chatbot node
def chatbot(state: ChatbotState):
    response = llm.invoke(state["messages"])
    return {"messages": [response]}

graph = StateGraph(ChatbotState)

graph.add_node("chatbot", chatbot)
graph.set_entry_point("chatbot")
graph.add_edge("chatbot", END)

app = graph.compile()

while True: 
    user_input = input("User: ")
    if(user_input in ["exit", "end"]):
        break
    else: 
        result = app.invoke({
            "messages": [HumanMessage(content=user_input)]
        })

        print(result)
