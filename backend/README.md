# DevInks Semantic Search Backend

Minimal FastAPI backend for in-memory semantic note search with FAISS.

## Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Endpoints

### `POST /notes`

Request:

```json
{
  "id": "note-1",
  "content": "FastAPI and FAISS work well for semantic search.",
  "url": "https://fastapi.tiangolo.com/"
}
```

Response:

```json
{
  "status": "indexed",
  "note": {
    "id": "note-1",
    "url": "https://fastapi.tiangolo.com/"
  }
}
```

### `POST /search`

Request:

```json
{
  "query": "vector search with embeddings"
}
```

Response:

```json
{
  "results": [
    {
      "id": "note-1",
      "content": "FastAPI and FAISS work well for semantic search.",
      "url": "https://fastapi.tiangolo.com/",
      "score": 0.82
    }
  ]
}
```

Returns the top 5 in-memory matches. Data is lost on restart.
