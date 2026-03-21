import { NoteRepository } from './repositories/NoteRepository.js';
import { askAI, semanticSearch, syncNote } from './services/ApiService.js';
import { getTotalNotes } from './services/MetricsService.js';
import { exportNotesAsPdf } from './services/PdfExportService.js';
import {
  finishSyncStatus,
  getSyncState,
  incrementSyncStatus,
  startSyncStatus,
  subscribeToSyncStatus,
} from './services/SyncStatusService.js';
import { parseMarkdown } from './utils/markdownRules.js';
import {
  filterNotesByKeyword,
  mapSemanticResultsToNotes,
  normalizeSearchQuery,
  noteHasSearchableContent,
} from './utils/dashboardSearch.js';
import { sortNotes } from './utils/dashboardSort.js';

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
  const askAiButton = document.getElementById('dashboard-ask-ai-btn');
  const exportPdfButton = document.getElementById('dashboard-export-pdf-btn');
  const exportStatus = document.getElementById('dashboard-export-status');
  const exportContainer = document.getElementById('export-container');
  const syncProgress = document.getElementById('dashboard-sync-progress');
  const syncProgressFill = document.getElementById(
    'dashboard-sync-progress-fill',
  );
  const syncProgressText = document.getElementById(
    'dashboard-sync-progress-text',
  );
  const totalNotesMetric = document.getElementById('dashboard-total-notes');
  const resultsMetric = document.getElementById('dashboard-results-count');
  const metricsDivider = document.getElementById('dashboard-metrics-divider');
  const sortControl = document.getElementById('dashboard-sort-control');
  const sortToggle = document.getElementById('dashboard-sort-toggle');
  const sortLabel = document.getElementById('dashboard-sort-label');
  const sortMenu = document.getElementById('dashboard-sort-menu');
  const aiPanel = document.getElementById('dashboard-ai-panel');
  const aiPanelMessage = document.getElementById('dashboard-ai-message');
  const aiPanelClose = document.getElementById('dashboard-ai-close');
  const aiAnswerSection = document.getElementById(
    'dashboard-ai-answer-section',
  );
  const aiAnswer = document.getElementById('dashboard-ai-answer');
  const aiSourcesSection = document.getElementById(
    'dashboard-ai-sources-section',
  );
  const aiSourcesList = document.getElementById('dashboard-ai-sources');
  const aiSourcesEmpty = document.getElementById('dashboard-ai-sources-empty');
  const aiCopyButton = document.getElementById('dashboard-ai-copy');
  let allNotes = [];
  let currentQuery = '';
  let debounceTimer;
  let latestSearchRequest = 0;
  let latestAskRequest = 0;
  let copyResetTimer;
  let exportStatusTimer;
  let currentAiAnswerText = '';
  let currentBaseVisibleNotes = [];
  let currentVisibleNotes = [];
  let isAsking = false;
  let isExporting = false;
  let syncHideTimeout;
  let sortOrder = 'desc';

  function setSearchStatusMode(mode) {
    searchStatus.className = `search-status ${mode}`;
    searchStatus.textContent =
      mode === 'semantic' ? 'AI Search Enabled ✓' : 'Offline Mode';
  }

  function isSearchActive(query = currentQuery) {
    return Boolean(query && query.trim().length > 0);
  }

  function renderResultsMetric(resultsCount) {
    const searchActive = isSearchActive();

    resultsMetric.textContent = `Results: ${resultsCount}`;
    resultsMetric.classList.toggle('dashboard-metric-hidden', !searchActive);
    metricsDivider.classList.toggle('dashboard-metric-hidden', !searchActive);
  }

  async function refreshTotalNotesMetric() {
    const totalNotes = await getTotalNotes();
    totalNotesMetric.textContent = `Total Notes: ${totalNotes}`;
  }

  function setAskAiButtonLoading(loading) {
    isAsking = loading;
    askAiButton.disabled = loading;
    askAiButton.textContent = loading ? 'Asking...' : 'Ask AI';
  }

  function setExportButtonLoading(loading) {
    isExporting = loading;
    exportPdfButton.disabled = loading;
    exportPdfButton.textContent = loading ? 'Exporting...' : 'Export PDF';
  }

  function showExportStatus(message) {
    window.clearTimeout(exportStatusTimer);
    exportStatus.hidden = false;
    exportStatus.textContent = message;
    exportStatusTimer = window.setTimeout(() => {
      exportStatus.hidden = true;
      exportStatus.textContent = '';
    }, 2200);
  }

  function renderSortControls() {
    const isMenuOpen = !sortMenu.hidden;

    sortLabel.textContent =
      sortOrder === 'asc' ? 'Oldest First' : 'Newest First';
    sortToggle.setAttribute('aria-expanded', String(isMenuOpen));

    Array.from(sortMenu.querySelectorAll('.sort-option')).forEach((option) => {
      const isActive = option.dataset.sortOrder === sortOrder;
      option.classList.toggle('sort-option-active', isActive);
    });
  }

  function closeSortMenu() {
    sortMenu.hidden = true;
    renderSortControls();
  }

  function toggleSortMenu() {
    sortMenu.hidden = !sortMenu.hidden;
    renderSortControls();
  }

  function openAiPanel() {
    aiPanel.hidden = false;
    aiPanel.setAttribute('aria-hidden', 'false');
  }

  function closeAiPanel() {
    aiPanel.hidden = true;
    aiPanel.setAttribute('aria-hidden', 'true');
  }

  function resetCopyButton() {
    window.clearTimeout(copyResetTimer);
    aiCopyButton.textContent = 'Copy';
  }

  function showAiMessage(message) {
    currentAiAnswerText = '';
    aiPanelMessage.hidden = false;
    aiPanelMessage.textContent = message;
    aiAnswer.innerHTML = '';
    aiAnswerSection.hidden = true;
    aiSourcesSection.hidden = true;
    aiSourcesList.innerHTML = '';
    aiSourcesEmpty.hidden = true;
    aiCopyButton.disabled = true;
    resetCopyButton();
  }

  function renderAiInsight(answer, sources = []) {
    currentAiAnswerText = answer || '';
    aiPanelMessage.hidden = true;
    aiAnswer.innerHTML = parseMarkdown(currentAiAnswerText);
    aiAnswerSection.hidden = false;
    aiSourcesSection.hidden = false;
    aiSourcesList.innerHTML = '';
    aiSourcesEmpty.hidden = sources.length > 0;
    aiCopyButton.disabled = currentAiAnswerText.trim().length === 0;
    resetCopyButton();

    sources.forEach((source) => {
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.className = 'ai-source-link';
      link.href = source.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.title = source.url;
      link.textContent = source.url;
      item.appendChild(link);
      aiSourcesList.appendChild(item);
    });
  }

  function renderSyncProgress(state) {
    const { total, completed, inProgress } = state;
    const progress = total > 0 ? (completed / total) * 100 : 0;

    syncProgressFill.style.width = `${progress}%`;
    syncProgressText.textContent = `Syncing notes... (${completed} / ${total})`;

    if (inProgress) {
      window.clearTimeout(syncHideTimeout);
      syncProgress.classList.remove('hidden');
      syncProgress.setAttribute('aria-hidden', 'false');
      return;
    }

    if (total === 0 || completed < total) {
      syncProgress.classList.add('hidden');
      syncProgress.setAttribute('aria-hidden', 'true');
      return;
    }

    window.clearTimeout(syncHideTimeout);
    syncHideTimeout = window.setTimeout(() => {
      syncProgress.classList.add('hidden');
      syncProgress.setAttribute('aria-hidden', 'true');
    }, 1200);
  }

  function renderNotes(
    visibleNotes = filterNotesByKeyword(allNotes, currentQuery),
  ) {
    currentBaseVisibleNotes = [...visibleNotes];
    currentVisibleNotes = sortNotes(visibleNotes, sortOrder);
    renderResultsMetric(currentVisibleNotes.length);

    if (currentVisibleNotes.length === 0) {
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
    notesList.innerHTML = currentVisibleNotes.map(renderNoteCard).join('');
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
      const canUseSemanticResults =
        semanticResults.length > 0 && !getSyncState().inProgress;

      if (canUseSemanticResults) {
        setSearchStatusMode('semantic');
        renderNotes(semanticResults);
        return;
      }

      setSearchStatusMode('offline');
      renderNotes(keywordResults);
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

  async function syncExistingNotes(notes) {
    startSyncStatus(notes.length);

    await Promise.all(
      notes.map(async (note) => {
        try {
          await syncNote(note);
        } finally {
          incrementSyncStatus();
        }
      }),
    );

    finishSyncStatus();

    if (currentQuery) {
      latestSearchRequest += 1;
      await runSearch(currentQuery, latestSearchRequest);
    }
  }

  async function handleAskAi() {
    if (isAsking) return;

    const query = searchInput.value.trim();
    openAiPanel();

    if (!query) {
      showAiMessage('Enter a query to generate AI insight');
      return;
    }

    const requestId = ++latestAskRequest;
    setAskAiButtonLoading(true);
    showAiMessage('Generating insight...');

    try {
      const response = await askAI(query);
      if (requestId !== latestAskRequest) return;

      renderAiInsight(
        response.answer || 'Unable to generate insight at the moment.',
        response.sources || [],
      );
    } catch (error) {
      if (requestId !== latestAskRequest) return;
      console.error('Failed to generate AI insight:', error);
      showAiMessage('Unable to generate insight at the moment.');
    } finally {
      if (requestId === latestAskRequest) {
        setAskAiButtonLoading(false);
      }
    }
  }

  async function handleExportPdf() {
    if (isExporting) return;

    const latestNotes = (await noteRepository.getAllNotes()).filter(
      noteHasSearchableContent,
    );
    const notesByUrl = new Map(latestNotes.map((note) => [note.url, note]));
    const notesToExport = currentVisibleNotes
      .map((note) => notesByUrl.get(note.url))
      .filter(Boolean);

    if (notesToExport.length === 0) {
      showExportStatus('No notes available to export');
      return;
    }

    setExportButtonLoading(true);

    try {
      await exportNotesAsPdf(notesToExport, exportContainer);
    } catch (error) {
      console.error('Failed to export notes as PDF:', error);
      showExportStatus('Unable to export notes right now');
    } finally {
      exportContainer.innerHTML = '';
      setExportButtonLoading(false);
    }
  }

  try {
    const notes = await noteRepository.getAllNotes();
    allNotes = notes.filter(noteHasSearchableContent);
    setSearchStatusMode('offline');
    await refreshTotalNotesMetric();
    subscribeToSyncStatus(renderSyncProgress);

    renderNotes();
    void syncExistingNotes(allNotes);
    renderSortControls();

    searchInput.addEventListener('input', (event) => {
      const nextQuery = normalizeSearchQuery(event.target.value);
      const requestId = ++latestSearchRequest;
      window.clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(async () => {
        await runSearch(nextQuery, requestId);
      }, 300);
    });

    askAiButton.addEventListener('click', () => {
      void handleAskAi();
    });

    exportPdfButton.addEventListener('click', () => {
      void handleExportPdf();
    });

    sortToggle.addEventListener('click', (event) => {
      event.stopPropagation();
      toggleSortMenu();
    });

    sortMenu.addEventListener('click', (event) => {
      const option = event.target.closest('.sort-option');
      if (!option) return;

      const nextSortOrder = option.dataset.sortOrder;
      if (!nextSortOrder || nextSortOrder === sortOrder) {
        closeSortMenu();
        return;
      }

      sortOrder = nextSortOrder;
      closeSortMenu();
      renderNotes(currentBaseVisibleNotes);
    });

    document.addEventListener('click', (event) => {
      if (!sortControl.contains(event.target)) {
        closeSortMenu();
      }
    });

    aiPanelClose.addEventListener('click', () => {
      closeAiPanel();
    });

    aiCopyButton.addEventListener('click', async () => {
      if (!currentAiAnswerText.trim()) return;

      try {
        await navigator.clipboard.writeText(currentAiAnswerText);
        aiCopyButton.textContent = 'Copied';
        window.clearTimeout(copyResetTimer);
        copyResetTimer = window.setTimeout(() => {
          aiCopyButton.textContent = 'Copy';
        }, 1200);
      } catch (error) {
        console.error('Failed to copy AI answer:', error);
      }
    });

    notesList.addEventListener('click', async (e) => {
      const btn = e.target.closest('.delete-note-btn');
      if (!btn) return;

      const didDelete = await handleDelete(btn.dataset.url);
      if (!didDelete) return;

      allNotes = allNotes.filter((note) => note.url !== btn.dataset.url);
      await refreshTotalNotesMetric();
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
