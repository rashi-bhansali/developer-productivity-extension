from fastapi import APIRouter

from app.models.schemas import SearchIn, SearchOut
from app.services.embedding_service import embed_text
from app.services.vector_store import search_notes

router = APIRouter()


@router.post("/search", response_model=SearchOut)
def search(payload: SearchIn):
    query_embedding = embed_text(payload.query)
    return {"results": search_notes(query_embedding, limit=5)}
