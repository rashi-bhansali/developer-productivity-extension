import faiss
import numpy as np

_index = None
_notes = []


def _build_index(dim: int):
    global _index
    _index = faiss.IndexFlatIP(dim)


def store_note(note_id: str, content: str, url: str, embedding: np.ndarray):
    global _notes
    _notes = [note for note in _notes if note["id"] != note_id]
    _notes.append(
        {"id": note_id, "content": content, "url": url, "embedding": embedding}
    )
    _build_index(len(embedding))
    _index.add(np.vstack([note["embedding"] for note in _notes]))


def search_notes(query_embedding: np.ndarray, limit: int = 5):
    if not _notes:
        return []
    scores, indices = _index.search(np.asarray([query_embedding]), min(limit, len(_notes)))
    return [
        {
            "id": _notes[i]["id"],
            "content": _notes[i]["content"],
            "url": _notes[i]["url"],
            "score": float(scores[0][rank]),
        }
        for rank, i in enumerate(indices[0])
        if i != -1
    ]
