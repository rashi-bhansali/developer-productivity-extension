import { NoteRepository } from './repositories/NoteRepository.js';

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

/**
 * Renders markdown to HTML, matching the extension's preview behaviour:
 * - Headings (h1–h3)
 * - Bold, italic, strikethrough, inline code
 * - Links → <a> with theme blue
 * - Bullet lists (- or *)
 * - Horizontal rule ---
 * - Line breaks preserved
 */
function renderMarkdownPreview(raw) {
  if (!raw) return '';

  const lines = raw.split('\n');
  const htmlLines = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Headings
    if (/^### (.+)/.test(line)) {
      if (inList) {
        htmlLines.push('</ul>');
        inList = false;
      }
      htmlLines.push(`<h3>${line.replace(/^### /, '')}</h3>`);
      continue;
    }
    if (/^## (.+)/.test(line)) {
      if (inList) {
        htmlLines.push('</ul>');
        inList = false;
      }
      htmlLines.push(`<h2>${line.replace(/^## /, '')}</h2>`);
      continue;
    }
    if (/^# (.+)/.test(line)) {
      if (inList) {
        htmlLines.push('</ul>');
        inList = false;
      }
      htmlLines.push(`<h1>${line.replace(/^# /, '')}</h1>`);
      continue;
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      if (inList) {
        htmlLines.push('</ul>');
        inList = false;
      }
      htmlLines.push('<hr>');
      continue;
    }

    // Bullet list items (- or *)
    if (/^(\s*)[-*] (.+)/.test(line)) {
      if (!inList) {
        htmlLines.push('<ul>');
        inList = true;
      }
      const content = line.replace(/^(\s*)[-*] /, '');
      htmlLines.push(`<li>${inlineFormat(content)}</li>`);
      continue;
    }

    // Close list if open and line is not a list item
    if (inList) {
      htmlLines.push('</ul>');
      inList = false;
    }

    // Empty line → paragraph break
    if (line.trim() === '') {
      htmlLines.push('<br>');
      continue;
    }

    // Normal paragraph line
    htmlLines.push(`<p>${inlineFormat(line)}</p>`);
  }

  if (inList) htmlLines.push('</ul>');

  return htmlLines.join('');
}

function inlineFormat(text) {
  return (
    text
      // Links — must come before other replacements
      .replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
      )
      // Bold
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Strikethrough
      .replace(/~~(.+?)~~/g, '<s>$1</s>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code>$1</code>')
  );
}

function getCellPreview(cell) {
  if (!cell || !cell.content || !cell.content.trim()) return null;
  if (cell.cellType === 'code') {
    return {
      type: 'code',
      html: `<code>${cell.content.trim().slice(0, 120)}</code>`,
    };
  }
  return { type: 'markdown', html: renderMarkdownPreview(cell.content) };
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

async function handleDelete(url) {
  const confirmed = window.confirm(
    `Delete all notes for:\n${url}\n\nThis cannot be undone.`,
  );
  if (!confirmed) return;

  try {
    await noteRepository.deleteNoteByUrl(url);
    const card = document.querySelector(
      `.note-card[data-url="${CSS.escape(url)}"]`,
    );
    if (card) card.remove();

    if (document.querySelectorAll('.note-card').length === 0) {
      document.getElementById('empty-state').style.display = 'flex';
    }
  } catch (error) {
    console.error('Failed to delete note:', error);
    alert('Failed to delete. Please try again.');
  }
}

async function renderDashboard() {
  const notesList = document.getElementById('notes-list');
  const emptyState = document.getElementById('empty-state');

  try {
    const notes = await noteRepository.getAllNotes();

    const nonEmptyNotes = notes.filter(
      (note) =>
        note.cells &&
        note.cells.length > 0 &&
        note.cells.some((cell) => cell.content && cell.content.trim()),
    );

    if (nonEmptyNotes.length === 0) {
      emptyState.style.display = 'flex';
      return;
    }

    notesList.innerHTML = nonEmptyNotes.map(renderNoteCard).join('');

    notesList.addEventListener('click', (e) => {
      const btn = e.target.closest('.delete-note-btn');
      if (!btn) return;
      handleDelete(btn.dataset.url);
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
