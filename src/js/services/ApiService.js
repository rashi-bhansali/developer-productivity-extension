const API_BASE_URL = 'http://127.0.0.1:8000';

function buildNotePayload(note) {
  return {
    id: note.url,
    content: (note.cells || []).map((cell) => cell.content || '').join('\n\n'),
    url: note.url,
  };
}

export async function syncNote(note) {
  try {
    const response = await fetch(`${API_BASE_URL}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildNotePayload(note)),
    });

    if (!response.ok) {
      throw new Error(`Note sync failed with status ${response.status}`);
    }

    const result = await response.json();
    console.log('Note synced to backend:', result.note?.id || note.url);
  } catch (error) {
    console.error('Failed to sync note to backend:', error);
  }
}

export async function semanticSearch(query) {
  const response = await fetch(`${API_BASE_URL}/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error(`Semantic search failed with status ${response.status}`);
  }

  return response.json();
}

export async function deleteSyncedNote(noteId) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/notes/${encodeURIComponent(noteId)}`,
      {
        method: 'DELETE',
      },
    );

    if (!response.ok) {
      throw new Error(`Note delete failed with status ${response.status}`);
    }

    const result = await response.json();
    console.log('Note deleted from backend:', result.note?.id || noteId);
  } catch (error) {
    console.error('Failed to delete note from backend:', error);
  }
}
