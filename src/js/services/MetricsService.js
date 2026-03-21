import { NoteRepository } from '../repositories/NoteRepository.js';
import { noteHasSearchableContent } from '../utils/dashboardSearch.js';

const noteRepository = new NoteRepository();

export async function getTotalNotes() {
  const notes = await noteRepository.getAllNotes();
  return notes.filter(noteHasSearchableContent).length;
}
