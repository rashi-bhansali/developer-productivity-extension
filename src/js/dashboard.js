import { NoteRepository } from './repositories/NoteRepository.js';
import { semanticSearch, syncNote } from './services/ApiService.js';
import { parseMarkdown } from './utils/markdownRules.js';
import {
  filterNotesByKeyword,
  mapSemanticResultsToNotes,
  normalizeSearchQuery,
  noteHasSearchableContent,
} from './utils/dashboardSearch.js';

const noteRepository = new NoteRepository();

// Apply saved theme before paint — mirrors DarkModeComponent.initializeSystemTheme()
(function applyTheme() {
  const saved = localStorage.getItem('devinks-theme');
  if (saved === 'dark') {
    document.body.classList.add('dark-mode');
  } else if (saved === 'light') {
    document.body.classList.remove('dark-mode');
  } else {
    const systemPrefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)',
    ).matches;
    document.body.classList.toggle('dark-mode', systemPrefersDark);
  }
})();

function formatDate(timestamp) {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getCellPreview(cell) {
  if (!cell || !cell.content || !cell.content.trim()) return null;
  if (cell.cellType === 'code') {
    return {
      type: 'code',
      html: `<code>${cell.content.trim().slice(0, 120)}</code>`,
    };
  }
  return { type: 'markdown', html: parseMarkdown(cell.content) };
}

function getCellTypeBadge(cell) {
  if (!cell) return '';
  if (cell.cellType === 'code') {
    return `<span class="cell-type-badge code">${cell.languageId || 'code'}</span>`;
  }
  return `<span class="cell-type-badge markdown">markdown</span>`;
}

function renderNoteCard(note) {
  const firstCell = note.cells && note.cells.length > 0 ? note.cells[0] : null;
  const cellCount = note.cells ? note.cells.length : 0;
  const preview = getCellPreview(firstCell);
  const badge = getCellTypeBadge(firstCell);
  const date = firstCell ? formatDate(firstCell.timestamp) : '';

  const previewHtml = preview
    ? `<div class="${preview.type === 'code' ? 'preview-code' : 'preview-rendered'}">${preview.html}</div>`
    : `<div class="preview-code muted">No content</div>`;

  const escapedUrl = note.url.replace(/"/g, '&quot;');

  return `
    <div class="note-card" data-url="${escapedUrl}">
      <div class="note-card-header">
        <div class="note-url" title="${escapedUrl}">
          <i class="fa-solid fa-link url-icon"></i>
          <span>${note.url}</span>
        </div>
        <div class="note-card-actions">
          <a class="visit-btn" href="${note.url}" target="_blank" rel="noopener noreferrer" title="Go to page">
            <i class="fa-solid fa-arrow-up-right-from-square"></i>
          </a>
          <button class="delete-note-btn" data-url="${escapedUrl}" title="Delete all notes for this URL">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
      <div class="note-card-preview">
        ${badge}
        ${previewHtml}
      </div>
      <div class="note-card-footer">
        <span class="cell-count">${cellCount} ${cellCount === 1 ? 'cell' : 'cells'}</span>
        ${date ? `<span class="note-date">${date}</span>` : ''}
      </div>
    </div>
  `;
}

function setEmptyState(isVisible, title, subtitle) {
  const emptyState = document.getElementById('empty-state');
  const emptyStateTitle = document.getElementById('empty-state-title');
  const emptyStateSubtitle = document.getElementById('empty-state-subtitle');

  emptyState.style.display = isVisible ? 'flex' : 'none';
  emptyStateTitle.textContent = title;
  emptyStateSubtitle.textContent = subtitle;
}

async function handleDelete(url) {
  const confirmed = window.confirm(
    `Delete all notes for:\n${url}\n\nThis cannot be undone.`,
  );
  if (!confirmed) return;

  try {
    await noteRepository.deleteNoteByUrl(url);
    return true;
  } catch (error) {
    console.error('Failed to delete note:', error);
    alert('Failed to delete. Please try again.');
    return false;
  }
}

async function renderDashboard() {
  const notesList = document.getElementById('notes-list');
  const searchInput = document.getElementById('dashboard-search');
  const searchStatus = document.getElementById('dashboard-search-status');
  let allNotes = [];
  let currentQuery = '';
  let debounceTimer;
  let latestSearchRequest = 0;

  function setSearchStatusMode(mode) {
    searchStatus.className = `search-status ${mode}`;
    searchStatus.textContent =
      mode === 'semantic' ? 'AI Search Enabled ✓' : 'Offline Mode';
  }

  function renderNotes(
    visibleNotes = filterNotesByKeyword(allNotes, currentQuery),
  ) {
    if (visibleNotes.length === 0) {
      notesList.innerHTML = '';

      if (allNotes.length === 0) {
        setEmptyState(
          true,
          'No notes yet.',
          'Open any webpage and start writing in DevInks.',
        );
      } else {
        setEmptyState(
          true,
          'No matching notes.',
          'Try a different keyword or URL.',
        );
      }
      return;
    }

    setEmptyState(false, '', '');
    notesList.innerHTML = visibleNotes.map(renderNoteCard).join('');
  }

  async function runSearch(query, requestId = latestSearchRequest) {
    currentQuery = query;

    if (!currentQuery) {
      if (requestId !== latestSearchRequest) return;
      renderNotes(allNotes);
      return;
    }

    try {
      const response = await semanticSearch(currentQuery);
      if (requestId !== latestSearchRequest) return;
      const semanticResults = mapSemanticResultsToNotes(
        response.results || [],
        allNotes,
      );
      const keywordResults = filterNotesByKeyword(allNotes, currentQuery);

      setSearchStatusMode('semantic');
      renderNotes(
        semanticResults.length > 0 || keywordResults.length === 0
          ? semanticResults
          : keywordResults,
      );
    } catch (error) {
      if (requestId !== latestSearchRequest) return;
      console.error(
        'Semantic search unavailable, falling back to keyword search:',
        error,
      );
      setSearchStatusMode('offline');
      renderNotes();
    }
  }

  try {
    const notes = await noteRepository.getAllNotes();
    allNotes = notes.filter(noteHasSearchableContent);
    setSearchStatusMode('offline');

    allNotes.forEach((note) => {
      void syncNote(note);
    });

    renderNotes();

    searchInput.addEventListener('input', (event) => {
      const nextQuery = normalizeSearchQuery(event.target.value);
      const requestId = ++latestSearchRequest;
      window.clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(async () => {
        await runSearch(nextQuery, requestId);
      }, 300);
    });

    notesList.addEventListener('click', async (e) => {
      const btn = e.target.closest('.delete-note-btn');
      if (!btn) return;

      const didDelete = await handleDelete(btn.dataset.url);
      if (!didDelete) return;

      allNotes = allNotes.filter((note) => note.url !== btn.dataset.url);
      await runSearch(currentQuery);
    });
  } catch (error) {
    console.error('Failed to load notes:', error);
    notesList.innerHTML = `
      <div class="error-state">
        <p>Failed to load notes. Please try reopening the dashboard.</p>
      </div>
    `;
  }
}

document.addEventListener('DOMContentLoaded', renderDashboard);
