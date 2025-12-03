import os
from dotenv import load_dotenv
import pymongo
import pprint

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME", "foundit_records")
COLLECTION_NAME = os.getenv("COLLECTION_NAME", "jobs")

print(f"Connecting to {DB_NAME}.{COLLECTION_NAME}...")

try:
    client = pymongo.MongoClient(MONGO_URI)
    db = client[DB_NAME]
    collection = db[COLLECTION_NAME]

    # Check connection
    client.admin.command('ping')
    print("Pinged your deployment. You successfully connected to MongoDB!")

    # Count documents
    count = collection.count_documents({})
    print(f"Total documents in collection: {count}")

    if count > 0:
        print("\nSample Document:")
        sample = collection.find_one()
        # Print keys only to avoid flooding console, but show embedding length if present
        keys = list(sample.keys())
        print(f"Keys: {keys}")
        
        if "skills_embedding" in sample:
            print(f"skills_embedding length: {len(sample['skills_embedding'])}")
        else:
            print("WARNING: 'skills_embedding' field missing in sample document!")
            
        print("-" * 20)
        pprint.pprint(sample)
    else:
        print("Collection is empty.")

except Exception as e:
    print(f"An error occurred: {e}")
