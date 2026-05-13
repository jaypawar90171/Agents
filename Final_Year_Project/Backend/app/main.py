import os
from fastapi import FastAPI
from app.api.routes import job_routes, roadmap_routes, roadmaps, chat, skill_routes
from fastapi.middleware.cors import CORSMiddleware
from app.db.mongodb import MongoDB

async def lifespan(app: FastAPI):
    # Startup
    await MongoDB.connect_db()
    yield
    # Shutdown
    await MongoDB.close_db()

app = FastAPI(title='Job API', lifespan=lifespan)

# Read allowed origins from env so production URLs are not hardcoded.
# FRONTEND_URL can be a comma-separated list: "https://app.example.com,http://localhost:5173"
_frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
allowed_origins = [url.strip() for url in _frontend_url.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "ok"}

app.include_router(job_routes.router)
app.include_router(roadmap_routes.router)

app.include_router(roadmaps.router)
app.include_router(chat.router)
app.include_router(skill_routes.router)
