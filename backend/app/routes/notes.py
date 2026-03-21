from fastapi import APIRouter, HTTPException

from app.models.schemas import NoteDeleteOut, NoteIn, NoteOut
from app.services.embedding_service import embed_text
from app.services.vector_store import delete_note, store_note

router = APIRouter()


@router.post("/notes", response_model=NoteOut)
def add_note(payload: NoteIn):
    embedding = embed_text(payload.content)
    store_note(payload.id, payload.content, payload.url, embedding)
    return {
        "status": "indexed",
        "note": {"id": payload.id, "url": payload.url},
    }


@router.delete("/notes/{note_id:path}", response_model=NoteDeleteOut)
def remove_note(note_id: str):
    try:
        deleted_note = delete_note(note_id)
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error

    return {
        "status": "deleted",
        "note": {"id": note_id, "url": deleted_note["url"]},
    }
