from typing import TypedDict, Annotated, Dict, List
from langgraph.graph import add_messages, StateGraph, END, START
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from dotenv import load_dotenv
from langgraph.prebuilt import ToolNode
from langchain.tools import tool
from pydantic import BaseModel
import json
import requests
from bs4 import BeautifulSoup
import PyPDF2
import re
import os


load_dotenv()

class ResumeArgs(BaseModel):
    file_path: str

class LinkedInArgs(BaseModel):
    profile_url: str

class SkillExtractionArgs(BaseModel):
    resume_text: str
    source_type: str

TECH_SKILLS = {
    "Languages": ["Python", "Java", "C++", "C", "JavaScript", "TypeScript", "Go", "Rust", 
                  "PHP", "Ruby", "Swift", "Kotlin", "R", "MATLAB", "Scala", "Haskell"],
    "Frontend": ["React", "Vue", "Angular", "Next.js", "Svelte", "HTML", "CSS", "Tailwind",
                 "Bootstrap", "Material UI", "Redux", "Zustand", "React Native"],
    "Backend": ["Node.js", "Express", "Django", "Flask", "FastAPI", "Spring", "Spring Boot",
                "ASP.NET", "Laravel", "Rails", "Gin", "Echo"],
    "Databases": ["SQL", "MySQL", "PostgreSQL", "MongoDB", "Firebase", "DynamoDB", "Redis",
                  "Cassandra", "Elasticsearch", "Oracle", "SQLite"],
    "Cloud": ["AWS", "Azure", "Google Cloud", "GCP", "Docker", "Kubernetes", "Heroku",
              "Vercel", "Netlify"],
    "Tools & Platforms": ["Git", "GitHub", "GitLab", "Jira", "Docker", "Jenkins", "Linux",
                          "Windows", "macOS", "VS Code", "IntelliJ", "Postman"],
    "DSA & Concepts": ["Data Structures", "Algorithms", "DSA", "OOP", "Design Patterns",
                       "System Design", "Microservices", "REST API", "GraphQL"],
    "Other": ["Machine Learning", "Deep Learning", "NLP", "TensorFlow", "PyTorch", "Pandas",
              "NumPy", "Scikit-learn", "API", "Testing", "Agile"]
}

@tool("extract_resume_text", args_schema=ResumeArgs)
def extract_resume_text(file_path: str) -> str:
    """
    Extracts text from a PDF or DOCX resume file.
    Supports .pdf and .docx formats.
    """
    try:
        if not os.path.exists(file_path):
            return json.dumps({
                "success": False,
                "error": f"File not found: {file_path}"
            })
           
        if file_path.endswith(".pdf"):
            text = extract_text_from_pdf(file_path)
            print(f"\n Extracted text from PDF resume: {file_path}")
        elif file_path.endswith(".docx"):
            text = extract_text_from_docx(file_path)
            print(f"\n Extracted text from DOCX resume: {file_path}")
        else:
            print(f"\n Unsupported file format: {file_path}")
            return json.dumps({
                "success": False,
                "error": "Unsupported file format"
            })

        return json.dumps({
            "success": True,
            "resume_text": text,
            "source_type": "resume",
            "file_path": file_path
        }, ensure_ascii=False, default=str)

    except Exception as e:
        print(f"\n Error extracting resume: {str(e)}")
        return json.dumps({
            "success": False,
            "error": str(e)
        })

@tool("scrape_linkedin_profile", args_schema=LinkedInArgs)
def scrape_linkedin_profile(profile_url: str) -> str:
    """
    Scrapes LinkedIn profile data using the provided URL.
    Extracts profile information, experience, and skills.
    """
    try:
        # Note: LinkedIn has strict scraping policies. 
        # For production, consider using LinkedIn API or a third-party service
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }

        response = requests.get(profile_url, headers=headers, timeout=10)
        response.raise_for_status()

        soup = BeautifulSoup(response.content, 'html.parser')

        profile_text = soup.get_text(separator='\n', strip=True)

        print(f"\n Scraped LinkedIn profile: {profile_url}")
        
        return json.dumps({
            "success": True,
            "profile_text": profile_text,
            "source_type": "linkedin",
            "profile_url": profile_url
        }, ensure_ascii=False, default=str)

    except Exception as e:
        print(f"\n Error scraping LinkedIn profile: {str(e)}")
        return json.dumps({
            "success": False,
            "error": str(e),
            "note": "LinkedIn scraping may require API access or alternative solutions"
        })

@tool("extract_skills", args_schema=SkillExtractionArgs)
def extract_skills_tool(resume_text: str, source_type: str) -> str:
    """
    Analyzes resume/profile text and extracts technical skills.
    Categorizes skills by type (Frontend, Backend, Languages, etc.).
    """
    try:
        extracted_skills = {category: [] for category in TECH_SKILLS.keys()}
        found_skills = set()
        
        text_lower = resume_text.lower()
        
        # Search for each skill in the text
        for category, skills in TECH_SKILLS.items():
            for skill in skills:
                skill_lower = skill.lower()
                
                # Use regex to find whole word matches
                pattern = r'\b' + re.escape(skill_lower) + r'\b'
                if re.search(pattern, text_lower):
                    extracted_skills[category].append(skill)
                    found_skills.add(skill)
        
        # Remove empty categories
        extracted_skills = {k: v for k, v in extracted_skills.items() if v}
        
        print(f"\n Extracted {len(found_skills)} skills from {source_type}")
        
        return json.dumps({
            "success": True,
            "skills_by_category": extracted_skills,
            "all_skills": sorted(list(found_skills)),
            "total_skills_found": len(found_skills),
            "source_type": source_type
        }, ensure_ascii=False, default=str)
    
    except Exception as e:
        print(f"\n Error extracting skills: {str(e)}")
        return json.dumps({
            "success": False,
            "error": str(e)
        })

def extract_text_from_pdf(file_path: str) -> str:
    """Helper function to extract text from PDF"""
    text = ""
    with open(file_path, 'rb') as file:
        pdf_reader = PyPDF2.PdfReader(file)
        for page_num in range(len(pdf_reader.pages)):
            page = pdf_reader.pages[page_num]
            text += page.extract_text()
    return text

def extract_text_from_docx(file_path: str) -> str:
    """Helper function to extract text from DOCX"""
    from docx import Document
    doc = Document(file_path)
    text = ""
    for para in doc.paragraphs:
        text += para.text + "\n"
    return text

tools = [extract_resume_text, scrape_linkedin_profile, extract_skills_tool]

llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0.7,
    max_tokens=2048
)
llm_with_tools = llm.bind_tools(tools)

SYSTEM_PROMPT = SystemMessage(content="""
You are a professional skills extraction assistant for computer science students.
Your job is to analyze resumes and LinkedIn profiles to extract technical skills.

WORKFLOW - Follow these steps STRICTLY:

1. FIRST: Based on the user input, determine if they provided:
   - A resume file path (local .pdf or .docx file)
   - A LinkedIn profile URL

2. EXTRACT SOURCE DATA:
   - If resume: Call extract_resume_text with the file path
   - If LinkedIn: Call scrape_linkedin_profile with the URL
   - Wait for the extraction to complete

3. ANALYZE AND EXTRACT SKILLS:
   - Call extract_skills with the extracted text and source type
   - This will categorize skills into: Languages, Frontend, Backend, Databases, Cloud, Tools, DSA, etc.

4. PRESENT RESULTS:
   - Show all extracted skills organized by category
   - Highlight total count of skills found
   - Format clearly for easy reading

IMPORTANT NOTES:
- Only extract TECHNICAL SKILLS relevant to computer science students
- Skills include: programming languages, frameworks, databases, cloud platforms, tools
- Organize results by category for better clarity
- If extraction fails, provide a helpful error message with suggestions
""")

class AgentState(TypedDict):
    messages: Annotated[list, add_messages]

def agent(state: AgentState):
    messages = [SYSTEM_PROMPT] + state["messages"]
    return {
        "messages": [llm_with_tools.invoke(messages)]
    }

def tool_router(state: AgentState):
    last_message = state["messages"][-1]
    if hasattr(last_message, "tool_calls") and len(last_message.tool_calls) > 0:
        return "tool_node"
    else:
        return END

tool_node = ToolNode(tools=tools)

subgraph = StateGraph(AgentState)
subgraph.add_node("agent", agent)
subgraph.add_node("tool_node", tool_node)
subgraph.set_entry_point("agent")
subgraph.add_conditional_edges("agent", tool_router)
subgraph.add_edge("tool_node", "agent")
search_app = subgraph.compile()

if __name__ == "__main__":

    # Case 1:
    resume_path = "resume.pdf"
    query = f"Extract skills from my resume at {resume_path}"

    # Case 2:
    # linkedin_url = "https://www.linkedin.com/in/mahamadtohid-naikwadi-842a64299/"
    # query = f"Extract skills from my LinkedIn profile at {linkedin_url}"

    print(f"\n Search Query: {query}\n")
    human = HumanMessage(content=query)

    response = search_app.invoke({"messages": [human]})
    print("\n=== FINAL RESULTS ===\n")
    
    # Extract and display the final response
    for msg in response["messages"]:
        if isinstance(msg, AIMessage) and msg.content:
            print(msg.content)