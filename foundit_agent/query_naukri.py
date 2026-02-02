import os
import sys
from dotenv import load_dotenv
import ollama
import pymongo

load_dotenv()

# --- Configuration & Connection ---
MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("NAUKRI_DB_NAME", "naukri_records")
COLLECTION_NAME = os.getenv("NAUKRI_COLLECTION_NAME", "jobs")
MODEL_NAME = os.getenv("MODEL_NAME", "qwen3-embedding:0.6b")

try:
    client = pymongo.MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    # Trigger a call to verify connection
    client.admin.command('ping')
    collection = client[DB_NAME][COLLECTION_NAME]
    print(f" Connected to database: {DB_NAME}")
except Exception as e:
    print(f" Database Connection Error: {e}")
    sys.exit(1)

# --- Query Logic ---
# query_text = "Looking for a Python Developer job"
query_text = "What are the skills required"

try:
    # 1. Embed the query
    print(f" Generating embedding for: '{query_text}'...")
    query_vector = ollama.embeddings(model=MODEL_NAME, prompt=query_text)['embedding']

    # 2. Search in MongoDB
    pipeline = [
        {
            "$vectorSearch": {
                "index": "vector_index", 
                "path": "skills_embedding",
                "queryVector": query_vector,
                "numCandidates": 10,
                "limit": 5 # Increased limit to filter by score later
            }
        },
        {
            "$project": {
                "job_title": 1,
                "company": 1,
                "job_url": 1,
                "score": {"$meta": "vectorSearchScore"}
            }
        },
        {
            "$match": {
                "score": {"$gte": 0.8}
            }
        }
    ]

    results = list(collection.aggregate(pipeline))

    # 3. Check if results list is empty
    if not results:
        print(f" No jobs found matching the criteria (Score >= 0.8).")
    else:
        print(f" Found {len(results)} matches:")
        for doc in results:
            print(f"- {doc['company']} | {doc['job_title']} (Score: {doc.get('score', 0):.4f})")
            print(f"  Link: {doc.get('job_url', 'N/A')}\n")

except ollama.ResponseError as e:
    print(f" Ollama Model Error: {e}")
except pymongo.errors.OperationFailure as e:
    print(f" MongoDB Atlas Error: {e}. Ensure your Vector Index is named 'vector_index'.")
except Exception as e:
    print(f" An unexpected error occurred: {e}")