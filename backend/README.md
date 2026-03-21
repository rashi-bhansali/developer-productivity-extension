# DevInks Semantic Search Backend

Minimal FastAPI backend for in-memory semantic note search with FAISS.

## Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export GOOGLE_API_KEY=your_api_key_here
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
Low-similarity matches are filtered out by a minimum score threshold, so unrelated queries can return zero results.

### `POST /ask`

Request:

```json
{
  "query": "What do my notes say about vector search?"
}
```

Response:

```json
{
  "answer": "Your notes describe FastAPI and FAISS as working well for semantic search.",
  "sources": [
    {
      "id": "note-1",
      "url": "https://fastapi.tiangolo.com/"
    }
  ]
}
```

If no relevant notes are found, the backend returns:

```json
{
  "answer": "No relevant notes found for this query.",
  "sources": []
}
```
