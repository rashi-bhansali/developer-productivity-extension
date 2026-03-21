import os

import google.generativeai as genai

from app.core.config import GOOGLE_API_KEY, LLM_MODEL

MAX_CONTEXT_NOTES = 3
MAX_NOTE_CHARS = 800
GENERATION_FALLBACK = "Unable to generate answer at the moment."


def generate_answer(query, retrieved_notes):
    api_key = (
        GOOGLE_API_KEY
        or os.getenv("GOOGLE_API_KEY")
    )
    if not api_key:
        return GENERATION_FALLBACK

    context = build_context(retrieved_notes[:MAX_CONTEXT_NOTES])
    prompt = f"""You are an expert software engineering assistant. 

                You have been provided with snippets from the user's personal developer notebook. Use these notes as your primary source of truth.

                Rules:
                1. Answer the user's question directly.
                2. If the provided Notes contain the answer, summarize it and highlight the relevant parts.
                3. If the Notes do not fully answer the question, you may use your general programming knowledge to fill in the gaps, but you MUST explicitly distinguish between what is from the user's notes and what is general knowledge.

                Notes:
                {context}

                Question:
                {query}
            """

    try:
        #print(f"DEBUG: Using API Key: '{api_key}'")
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(LLM_MODEL)
        response = model.generate_content(prompt)
        return (response.text or "").strip() or GENERATION_FALLBACK
    except Exception as e:
        print(f"\n--- GEMINI API ERROR ---\n{e}\n------------------------\n")
        return GENERATION_FALLBACK


def build_context(retrieved_notes):
    return "\n\n---\n\n".join(
        (
            f"Note ID: {note['id']}\n"
            f"URL: {note['url']}\n"
            f"Content:\n{(note['content'] or '').strip()[:MAX_NOTE_CHARS]}"
        )
        for note in retrieved_notes
    )
