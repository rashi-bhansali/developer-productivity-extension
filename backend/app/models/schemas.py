from typing import List

from pydantic import BaseModel


class NoteIn(BaseModel):
    id: str
    content: str
    url: str


class SearchIn(BaseModel):
    query: str


class NoteMeta(BaseModel):
    id: str
    url: str


class NoteOut(BaseModel):
    status: str
    note: NoteMeta


class NoteDeleteOut(BaseModel):
    status: str
    note: NoteMeta


class SearchResult(BaseModel):
    id: str
    content: str
    url: str
    score: float


class SearchOut(BaseModel):
    results: List[SearchResult]
