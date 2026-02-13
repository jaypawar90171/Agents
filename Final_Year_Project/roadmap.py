import os
import sys
from dotenv import load_dotenv
import ollama
import pymongo
from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME", "foundit_records")
COLLECTION_NAME = os.getenv("COLLECTION_NAME", "jobs")

EMBED_MODEL = os.getenv("MODEL_NAME", "qwen3-embedding:0.6b")
CHAT_MODEL = "llama-3.3-70b-versatile"

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

def retrieve_documents(query_embedding, company_name:str):
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
                "company": {
                    "$regex": company_name,
                    "$options": "i"  # Case-insensitive matching
                }
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

    llm = ChatGroq(
        model=CHAT_MODEL,
        groq_api_key=GROQ_API_KEY,
        temperature=0.2
    )

    prompt_template = ChatPromptTemplate.from_messages([
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
        """)
    ])

    formatted_prompt = prompt_template.format_messages(
        company=company,
        context=context
    )

    # Generate response using ChatGroq
    response = llm.invoke(formatted_prompt)

    return response.content

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
    documents = retrieve_documents(query_embedding, company_query)
    
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