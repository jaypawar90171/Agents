from app.db.connection import jobs_collection

def serialize_job(job):
    job["_id"] = str(job["_id"])
    job.pop("skills_embedding", None)
    job.pop("job_embedding", None)
    return job

def fetch_jobs():
    jobs = jobs_collection.find()
    return [serialize_job(job) for job in jobs]