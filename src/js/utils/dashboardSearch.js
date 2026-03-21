export function normalizeSearchQuery(query) {
  return (query || '').trim().toLowerCase();
}

export function noteHasSearchableContent(note) {
  return (
    note.cells &&
    note.cells.length > 0 &&
    note.cells.some((cell) => cell.content && cell.content.trim())
  );
}

export function filterNotesByKeyword(notes, query) {
  const normalizedQuery = normalizeSearchQuery(query);

  if (!normalizedQuery) {
    return notes;
  }

  return notes.filter((note) => noteMatchesKeyword(note, normalizedQuery));
}

export function mapSemanticResultsToNotes(results, notes) {
  return results
    .map((result) => notes.find((note) => note.url === result.url))
    .filter(Boolean);
}

function noteMatchesKeyword(note, normalizedQuery) {
  const urlMatches = (note.url || '').toLowerCase().includes(normalizedQuery);
  const contentMatches = (note.cells || []).some((cell) =>
    (cell.content || '').toLowerCase().includes(normalizedQuery),
  );

  return urlMatches || contentMatches;
}
