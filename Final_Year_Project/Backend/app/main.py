from fastapi import FastAPI
from app.api.routes import job_routes, roadmap_routes
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title='Job API')  

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(job_routes.router)
app.include_router(roadmap_routes.router)
