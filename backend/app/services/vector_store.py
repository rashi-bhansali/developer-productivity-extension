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
    _rebuild_index(len(embedding))


def _rebuild_index(dim: int):
    _build_index(dim)
    if _notes:
        _index.add(np.vstack([note["embedding"] for note in _notes]))


def delete_note(note_id: str):
    global _notes, _index
    deleted_note = next((note for note in _notes if note["id"] == note_id), None)
    if not deleted_note:
        raise ValueError(f"Note not found: {note_id}")

    _notes = [note for note in _notes if note["id"] != note_id]

    if _notes:
        _rebuild_index(len(_notes[0]["embedding"]))
    else:
        _index = None

    return deleted_note


def search_notes(query_embedding: np.ndarray, limit: int = 5, min_score: float = 0.0):
    if not _notes or _index is None:
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
        if i != -1 and float(scores[0][rank]) >= min_score
    ]
