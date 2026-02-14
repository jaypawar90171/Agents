import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("FOUNDIT_DB_NAME")

client = MongoClient(MONGO_URI)
db = client[DB_NAME]

jobs_collection = db[os.getenv("FOUNDIT_COLLECTION_NAME")]