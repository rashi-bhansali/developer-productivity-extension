from fastapi import FastAPI

from app.routes.notes import router as notes_router
from app.routes.rag import router as rag_router
from app.routes.search import router as search_router

app = FastAPI(title="DevInks Semantic Search")
app.include_router(notes_router)
app.include_router(search_router)
app.include_router(rag_router)
