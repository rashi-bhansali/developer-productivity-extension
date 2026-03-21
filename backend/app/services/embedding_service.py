import numpy as np
from sentence_transformers import SentenceTransformer

from app.core.config import EMBEDDING_MODEL

model = SentenceTransformer(EMBEDDING_MODEL)


def embed_text(text: str) -> np.ndarray:
    vector = model.encode(text, normalize_embeddings=True)
    return np.asarray(vector, dtype="float32")

