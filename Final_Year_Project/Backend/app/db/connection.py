import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME", "job_records") # Second arg is a default fallback

client = MongoClient(MONGO_URI)
db = client[DB_NAME]

jobs_collection = db[os.getenv("COLLECTION_NAME", "jobs")]  