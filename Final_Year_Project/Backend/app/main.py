from fastapi import FastAPI
<<<<<<< HEAD
from app.api.routes import job_routes, roadmap_routes
=======
from app.api.routes import job_routes, roadmap_routes, roadmaps, chat
>>>>>>> 0e88ba4b78691ac013f8eeec52b387cc9bb7ab25
from fastapi.middleware.cors import CORSMiddleware
from app.db.mongodb import MongoDB

async def lifespan(app: FastAPI):
    # Startup
    await MongoDB.connect_db()
    yield
    # Shutdown
    await MongoDB.close_db()

app = FastAPI(title='Job API', lifespan=lifespan)  

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(job_routes.router)
app.include_router(roadmap_routes.router)
<<<<<<< HEAD
=======
app.include_router(roadmaps.router)
app.include_router(chat.router)
>>>>>>> 0e88ba4b78691ac013f8eeec52b387cc9bb7ab25
