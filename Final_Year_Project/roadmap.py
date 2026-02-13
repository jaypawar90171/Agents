import os
import sys
from dotenv import load_dotenv
import ollama
import pymongo
from langchain_core.prompts import ChatPromptTemplate

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME", "foundit_records")
COLLECTION_NAME = os.getenv("COLLECTION_NAME", "jobs")

EMBED_MODEL = os.getenv("MODEL_NAME", "qwen3-embedding:0.6b")
CHAT_MODEL = "granite4"

TOP_K = 10
MIN_SCORE = 0.5
MAX_CONTEXT_CHARS = 3500

try:
    client = pymongo.MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    client.admin.command("ping")
    collection = client[DB_NAME][COLLECTION_NAME]
    print(f"Connected to database: {DB_NAME}")
except Exception as e:
    print(f"Database connection failed: {e}")
    sys.exit(1)

def validate_query(query: str) -> bool:
    return bool(query and len(query.strip()) >= 3)

def embed_query(query: str):
    return ollama.embeddings(
        model=EMBED_MODEL,
        prompt=query
    )["embedding"]

def retrieve_documents(query_embedding):
    pipeline = [
        {
            "$vectorSearch": {
                "index": "foundit_job_vector_index",
                "path": "job_embedding",
                "queryVector": query_embedding,
                "numCandidates": 50,
                "limit": TOP_K
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
                "score": {"$meta": "vectorSearchScore"}
            }
        },
        {
            "$match": {
                "score": {"$gte": MIN_SCORE}
            }
        }
    ]

    results = list(collection.aggregate(pipeline))

    print("\nDEBUG: Raw vector search results:")
    for r in results:
        print(f"  {r.get('company')} | {r.get('job_title')} | Score: {r.get('score'):.4f}")

    # Apply score filtering in Python
    filtered = [r for r in results if r.get("score", 0) >= MIN_SCORE]

    print(f"\nDEBUG: Results after MIN_SCORE filter ({MIN_SCORE}): {len(filtered)}")

    return filtered

def trim_context(context: str) -> str:
    if len(context) > MAX_CONTEXT_CHARS:
        return context[:MAX_CONTEXT_CHARS] + "..."
    return context

def generate_answer(company: str, context: str):
    prompt_template = ChatPromptTemplate.from_messages([
        ("system", """You are an expert career counselor and technical mentor specializing in creating personalized learning roadmaps for software engineering roles. Your goal is to analyze job requirements and generate detailed, actionable 12-16 week study plans.

        CRITICAL RULES:
        - You MUST generate roadmap ONLY for the company specified.
        - You are NOT allowed to change the company name.
        - If context contains other companies, IGNORE them.
        - The roadmap summary MUST contain the exact company name given.
        - Do NOT hallucinate locations or roles not present in context.

        **Your Task:**
        Generate a comprehensive, week-by-week learning roadmap that prepares someone for their target role at the specified company.

        **Output Format Requirements:**

        1. **ROADMAP SUMMARY** (at the top):
        - Target Company
        - Role Title
        - Duration (in weeks)
        - Total Topics Count
        - Location (if relevant)

        2. **SKILL ASSESSMENT** (if multiple jobs found):
        - List all available positions/roles at the company
        - Identify common skills across roles
        - Identify unique skills per role
        - Provide TWO OPTIONS:
            a) "Focused Path" - User should specify which exact role they're targeting
            b) "Comprehensive Path" - Cover all skills from all available positions
        
        If only ONE job/role is found, proceed directly with the roadmap.
        If MULTIPLE jobs found and user hasn't specified, default to "Comprehensive Path" covering all skills.

        3. **WEEKLY BREAKDOWN** (16 weeks standard, adjust 12-20 based on complexity):
        Structure each week as:
        - **Week X-Y: [Phase Name]**
        - **Focus:** [Main topic/skill]
        - **Topics:** [Specific subtopics, technologies, concepts]
        - **Deliverables:** [Practice problems, projects, or milestones]
        - **Time Commitment:** [Hours per day/week if relevant]

        Phase Examples:
        - Weeks 1-2: Foundation Setup & Basics
        - Weeks 3-5: Core Technical Skills
        - Weeks 6-8: Advanced Concepts & Data Structures
        - Weeks 9-11: System Design & Architecture
        - Weeks 12-14: Mock Interviews & Practice
        - Weeks 15-16: Final Preparation & Application

        4. **OVERALL PROGRESS TRACKER:**
        - X% complete • Week Y of 16
        - Progress bar visualization

        5. **RECOMMENDED RESOURCES:**
        Provide 3-5 high-quality resources:
        - LeetCode patterns or problem sets
        - YouTube channels or playlists
        - Documentation links
        - Online courses (free preferred)
        - Company career portal

        **Key Principles:**
        - Be SPECIFIC: Don't say "learn Python" - say "Master Python data structures: lists, dicts, sets. Practice 2 problems/day"
        - Be REALISTIC: Account for working professionals (10-15 hrs/week) or full-time learners (30-40 hrs/week)
        - Be PROGRESSIVE: Build from fundamentals to advanced concepts logically
        - Be PRACTICAL: Include hands-on projects, not just theory
        - Be MOTIVATING: Set clear milestones and achievable weekly goals

        **Tone:** Encouraging, practical, and mentor-like. Make the journey feel achievable."""),
        ("user", """
            Target Company: {company}
            Avaiable Job Data: {context}
            **User Request:** Generate my personalized learning roadmap to prepare for a role at {company}.
            Please analyze the job requirements and create a detailed week-by-week roadmap following the format specified in your instructions.
        """)
    ])

    formatted_prompt = prompt_template.format_messages(
        company=company,
        context=context
    )

    # Generate response using Ollama
    response = ollama.chat(
        model=CHAT_MODEL,
        messages=[
            {"role": msg.type, "content": msg.content} 
            for msg in formatted_prompt
        ]
    )

    return response["message"]["content"]

def format_context(documents: list) -> str:
    """Format retrieved documents into readable context"""
    if not documents:
        return "No relevant job postings found for this company."
    
    context_parts = []
    for idx, doc in enumerate(documents, 1):
        context_parts.append(f"""
            Job Listing {idx}:
            - Company: {doc.get('company', 'N/A')}
            - Role: {doc.get('job_title', 'N/A')}
            - Location: {doc.get('location', 'N/A')}
            - Required Skills: {', '.join(doc.get('skills_required', []))}
            - Description: {doc.get('job_description_summary', 'N/A')}
            - Apply URL: {doc.get('job_url', 'N/A')}
            - Relevance Score: {doc.get('score', 0):.2f}
        """)
    
    return "\n".join(context_parts)

def main():
    """Main execution flow"""
    print("=== Career Roadmap Generator ===\n")
    
    # Get user input
    company_query = input("Enter target company name (e.g., Google, Amazon, Microsoft): ").strip()
    
    if not validate_query(company_query):
        print("Error: Please enter a valid company name (at least 3 characters)")
        return
    
    print(f"\nSearching for {company_query} positions...")
    
    # Generate embedding and retrieve documents
    query_embedding = embed_query(company_query)
    documents = retrieve_documents(query_embedding)
    
    if not documents:
        print(f"\nNo job listings found for '{company_query}'")
        print("Try:")
        print("  - Checking spelling")
        print("  - Using company's full legal name")
        print("  - Searching for a related/parent company")
        return
    
    print(f"\nFound {len(documents)} relevant position(s) at {documents[0].get('company', company_query)}")
    
    # Show brief summary
    print("\nPositions found:")
    for idx, doc in enumerate(documents, 1):
        print(f"  {idx}. {doc.get('job_title', 'Unknown')} - {doc.get('location', 'Location N/A')}")
    
    # Format context and generate roadmap
    print("\nGenerating your personalized roadmap...")
    context = format_context(documents)
    context = trim_context(context)
    
    roadmap = generate_answer(company_query, context)
    
    print("\n" + "="*80)
    print(roadmap)
    print("="*80)
    
    # Save to file option
    save = input("\nSave roadmap to file? (y/n): ").strip().lower()
    if save == 'y':
        filename = f"roadmap_{company_query.replace(' ', '_')}_{documents[0].get('job_title', 'role').replace(' ', '_')}.txt"
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(f"Career Roadmap: {company_query}\n")
            f.write(f"Generated: {__import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write("="*80 + "\n\n")
            f.write(roadmap)
        print(f"Saved to: {filename}")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nGoodbye!")
    except Exception as e:
        print(f"\nError: {e}")