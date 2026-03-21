from fastapi import APIRouter

from app.models.schemas import NoteIn, NoteOut
from app.services.embedding_service import embed_text
from app.services.vector_store import store_note

router = APIRouter()


@router.post("/notes", response_model=NoteOut)
def add_note(payload: NoteIn):
    embedding = embed_text(payload.content)
    store_note(payload.id, payload.content, payload.url, embedding)
    return {
        "status": "indexed",
        "note": {"id": payload.id, "url": payload.url},
    }
