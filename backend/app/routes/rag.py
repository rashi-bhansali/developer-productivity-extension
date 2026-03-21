from fastapi import APIRouter

from app.core.config import MAX_RESULTS, MIN_SCORE_THRESHOLD
from app.models.schemas import AskIn, AskOut
from app.services.embedding_service import embed_text
from app.services.rag_service import generate_answer
from app.services.vector_store import search_notes

router = APIRouter()

NO_RESULTS_MESSAGE = "No relevant notes found for this query."
GENERATION_FALLBACK = "I couldn't generate an answer right now."


@router.post("/ask", response_model=AskOut)
def ask(payload: AskIn):
    query_embedding = embed_text(payload.query)
    retrieved_notes = search_notes(query_embedding, limit=MAX_RESULTS)
    filtered_notes = [
        note
        for note in retrieved_notes
        if note["score"] >= MIN_SCORE_THRESHOLD
    ][:MAX_RESULTS]

    if not filtered_notes:
        return {"answer": NO_RESULTS_MESSAGE, "sources": []}

    sources = [
        {"id": note["id"], "url": note["url"]}
        for note in filtered_notes
    ]

    try:
        answer = generate_answer(payload.query, filtered_notes)
    except Exception as error:
        print(f"OpenAI generation failed: {error}")
        return {"answer": GENERATION_FALLBACK, "sources": sources}

    return {
        "answer": answer or GENERATION_FALLBACK,
        "sources": sources,
    }
