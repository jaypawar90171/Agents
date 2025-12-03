import os
from dotenv import load_dotenv
load_dotenv()
import ollama
import pymongo


MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME", "foundit_records") # Second arg is a default fallback
COLLECTION_NAME = os.getenv("COLLECTION_NAME", "jobs")
MODEL_NAME = os.getenv("MODEL_NAME", "qwen3-embedding:0.6b")

client = pymongo.MongoClient(MONGO_URI)
collection = client[DB_NAME][COLLECTION_NAME]

print(f"Connected to database: {DB_NAME}")

query_text = "Looking for a Java Developer job"

# 1. Embed the query
query_vector = ollama.embeddings(model=MODEL_NAME, prompt=query_text)['embedding']

# 2. Search in MongoDB
results = collection.aggregate([
    {
        "$vectorSearch": {
            "index": "vector_index", # Or whatever you named your index
            "path": "skills_embedding",
            "queryVector": query_vector,
            "numCandidates": 10,
            "limit": 2
        }
    },
    {
        "$project": {
            "job_title": 1,
            "company": 1,
            "job_url": 1,
            "score": {"$meta": "vectorSearchScore"} # See how good the match is
        }
    }
])

for doc in results:
    print(f"Found: {doc['company']} - {doc['job_title']} (Score: {doc['score']}) \n Link:- {doc['job_url']}")