"""
Roadmap generation service: embeds company query via Ollama, retrieves jobs via
MongoDB vector search, and generates a skill-based learning roadmap via Groq.
Uses the app's jobs_collection (FOUNDIT_DB_NAME / FOUNDIT_COLLECTION_NAME).
"""
import os
import logging
import ollama
from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq

from app.db.connection import jobs_collection

logger = logging.getLogger(__name__)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
EMBED_MODEL = os.getenv("MODEL_NAME", "qwen3-embedding:0.6b")
CHAT_MODEL = "llama-3.3-70b-versatile"
TOP_K = 10
MIN_SCORE = 0.5
MAX_CONTEXT_CHARS = 3500
VECTOR_INDEX = "vector_index"

# Custom exceptions for the route to map to HTTP status codes
class RoadmapValidationError(ValueError):
    """Company name validation failed (e.g. too short)."""
    pass

class RoadmapNotFoundError(ValueError):
    """No job listings found for the company."""
    pass

class RoadmapServiceError(RuntimeError):
    """Ollama or Groq (or other external) failure."""
    pass


def validate_query(query: str) -> bool:
    return bool(query and len(query.strip()) >= 3)


def embed_query(query: str):
    try:
        return ollama.embeddings(model=EMBED_MODEL, prompt=query)["embedding"]
    except Exception as e:
        logger.exception("Ollama embedding failed: %s", e)
        raise RoadmapServiceError("Embedding service unavailable") from e


def retrieve_documents(query_embedding, company_name: str):
    pipeline = [
        {
            "$vectorSearch": {
                "index": VECTOR_INDEX,
                "path": "job_embedding",
                "queryVector": query_embedding,
                "numCandidates": 50,
                "limit": TOP_K,
            }
        },
        {
            "$project": {
                "_id": 0,
                "company": 1,
                "job_title": 1,
                "location": 1,
                "skills_required": 1,
                "job_description_summary": 1,
                "job_url": 1,
                "score": {"$meta": "vectorSearchScore"},
            }
        },
        {
            "$match": {
                "company": {"$regex": company_name, "$options": "i"}
            }
        },
    ]
    results = list(jobs_collection.aggregate(pipeline))
    filtered = [r for r in results if r.get("score", 0) >= MIN_SCORE]
    return filtered


def trim_context(context: str) -> str:
    if len(context) > MAX_CONTEXT_CHARS:
        return context[:MAX_CONTEXT_CHARS] + "..."
    return context


def format_context(documents: list) -> str:
    if not documents:
        return "No relevant job postings found for this company."
    parts = []
    for idx, doc in enumerate(documents, 1):
        parts.append(
            f"""
            Job Listing {idx}:
            - Company: {doc.get('company', 'N/A')}
            - Role: {doc.get('job_title', 'N/A')}
            - Location: {doc.get('location', 'N/A')}
            - Required Skills: {', '.join(doc.get('skills_required', []))}
            - Description: {doc.get('job_description_summary', 'N/A')}
            - Apply URL: {doc.get('job_url', 'N/A')}
            - Relevance Score: {doc.get('score', 0):.2f}
        """
        )
    return "\n".join(parts)


def _build_roadmap_prompt():
    return ChatPromptTemplate.from_messages([
        ("system", """You are an expert career counselor and technical mentor. Your specialty is creating SKILL-BASED learning roadmaps tailored to specific job requirements.

        **CRITICAL INSTRUCTION:**
        You MUST generate a roadmap based ONLY on the EXACT skills listed in "Required Skills" from the job data provided. 
        DO NOT use generic phases or your own assumptions about what skills are needed.
        DO NOT hallucinate or change the company name.
        DO NOT add skills not mentioned in the context.

        **Your Task:**
        Analyze the job posting data and create a week-by-week roadmap that teaches EACH SKILL mentioned in the "Required Skills" list.

        **MANDATORY OUTPUT FORMAT:**

        ### ROADMAP SUMMARY
        - **Target Company**: [EXACT company name from context]
        - **Role Title**: [EXACT job title from context]
        - **Duration**: [Calculate: number of skills × 1-2 weeks, range 12-20 weeks]
        - **Total Skills to Master**: [Count of skills from skills_required array]
        - **Location**: [EXACT location from context]

        ---

        ### SKILLS ANALYSIS
        [List ALL skills from the skills_required array]

        Core Technical Skills:
        - [Skill 1]
        - [Skill 2]
        - [etc...]

        Soft Skills / Supporting Skills:
        - [Skill N]

        ---

        ### WEEKLY BREAKDOWN

        **CRITICAL RULE**: Each week must focus on 1-2 SPECIFIC SKILLS from the skills_required list.

        For EACH skill, create a dedicated learning block:

        **Week X-Y: [Skill Name from skills_required]**
        - **What You'll Learn**: 
        - Core concepts of [skill]
        - Key technologies/tools related to [skill]
        - Best practices and common patterns
        - How this skill is used in the specific role

        - **Study Plan**:
        - Day 1-2: [Specific subtopic]
        - Day 3-4: [Specific subtopic]
        - Day 5-7: [Hands-on practice]

        - **Hands-on Practice**:
        - [Specific project/exercise using this skill]
        - [Coding challenges or problems]
        - [Build something practical]

        - **Free Resources**:
        1. [Official documentation link if available]
        2. [YouTube tutorial/playlist specific to this skill]
        3. [Free course or tutorial website]
        4. [Practice platform if applicable]

        - **Success Criteria**: 
        - [How to know you've mastered this skill]
        - [What you should be able to build/do]

        **Time Commitment**: [10-15 hrs/week for working professionals, 25-30 hrs/week for full-time learners]

        ---

        ### INTEGRATION WEEKS (Final 2-3 weeks)

        **Week N-1: Project Integration**
        - Build a complete project combining ALL skills learned
        - [Suggest specific project based on role requirements]

        **Week N: Interview Preparation**
        - Technical interview prep for this specific role
        - Behavioral questions related to the position
        - Resume tailoring
        - Application submission

        ---

        ### OVERALL PROGRESS TRACKER
        - 0% complete • Week 0 of [total weeks]

        ---

        ### RECOMMENDED RESOURCES

        **Company-Specific**:
        - [Company career portal]
        - [Company tech blog if exists]

        **Skill-Specific** (organized by skill):
        For [Skill 1]:
        - [Resource 1]
        - [Resource 2]

        For [Skill 2]:
        - [Resource 1]
        - [Resource 2]

        **General Preparation**:
        - [Interview prep resources]
        - [Portfolio building guides]

        ---

        **EXAMPLE FORMAT FOR TECHNICAL SKILLS:**

        Week 1-2: Core Java
        - What You'll Learn:
        - Object-Oriented Programming principles
        - Collections Framework (List, Set, Map)
        - Exception Handling
        - Multithreading basics
        
        - Study Plan:
        - Day 1-3: OOP concepts, classes, inheritance, polymorphism
        - Day 4-6: Collections and generics
        - Day 7-10: Exception handling and file I/O
        - Day 11-14: Multithreading and concurrency
        
        - Hands-on Practice:
        - Build a multi-threaded file processor
        - Solve 20 Java problems on HackerRank
        - Create a simple inventory management system using OOP
        
        - Free Resources:
        1. Oracle Java Tutorials: https://docs.oracle.com/javase/tutorial/
        2. Java Programming Course by freeCodeCamp (YouTube)
        3. Exercism Java Track: https://exercism.org/tracks/java
        4. Practice on HackerRank Java domain
        
        - Success Criteria:
        - Can write clean, maintainable Java code
        - Understand when to use different collection types
        - Can implement basic concurrent programs

        **REMEMBER**: 
        - Map EVERY skill from skills_required to weeks
        - Be specific about what to learn within each skill
        - Provide actual free resources (docs, YouTube, free courses)
        - Focus on practical, hands-on learning
        - Group related skills together when it makes sense (e.g., "Oracle SQL" + "PL/SQL" in consecutive weeks)"""),
        ("user", """
            **Target Company**: {company}
            **Available Job Data**:
            {context}

            **Instructions**: 
            1. Extract ALL skills from the "Required Skills" lists in the job data above
            2. Create a week-by-week roadmap where EACH skill gets dedicated learning time
            3. Provide specific, actionable learning resources for EACH skill
            4. Use the EXACT company name and role title from the data
            5. Do NOT add generic phases - map directly to the actual required skills

            Generate the complete roadmap now.
        """),
    ])


def generate_answer(company: str, context: str) -> str:
    if not GROQ_API_KEY:
        raise RoadmapServiceError("GROQ_API_KEY is not configured")
    llm = ChatGroq(
        model=CHAT_MODEL,
        groq_api_key=GROQ_API_KEY,
        temperature=0.5,
    )
    prompt_template = _build_roadmap_prompt()
    formatted_prompt = prompt_template.format_messages(company=company, context=context)
    try:
        response = llm.invoke(formatted_prompt)
        return response.content
    except Exception as e:
        logger.exception("Groq LLM invocation failed: %s", e)
        raise RoadmapServiceError("Roadmap generation service unavailable") from e


def _jobs_used_summary(documents: list) -> list:
    """Return a list of job summaries (no embeddings) for the API response."""
    return [
        {
            "company": doc.get("company"),
            "job_title": doc.get("job_title"),
            "location": doc.get("location"),
            "skills_required": doc.get("skills_required", []),
            "job_url": doc.get("job_url"),
        }
        for doc in documents
    ]


def generate_roadmap(company_name: str) -> dict:
    """
    Generate a skill-based learning roadmap for the given company.
    Returns {"roadmap": "<markdown>", "jobs_used": [...]}.
    Raises RoadmapValidationError, RoadmapNotFoundError, or RoadmapServiceError.
    """
    company_name = (company_name or "").strip()
    if not validate_query(company_name):
        raise RoadmapValidationError("Company name must be at least 3 characters")

    query_embedding = embed_query(company_name)
    documents = retrieve_documents(query_embedding, company_name)

    if not documents:
        raise RoadmapNotFoundError(f"No job listings found for '{company_name}'")

    context = format_context(documents)
    context = trim_context(context)
    roadmap = generate_answer(company_name, context)

    return {
        "roadmap": roadmap,
        "jobs_used": _jobs_used_summary(documents),
    }
