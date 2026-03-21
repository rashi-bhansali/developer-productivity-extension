import { parseMarkdown } from '../utils/markdownRules.js';
import { getNoteCreatedTimestamp } from '../utils/dashboardSort.js';

const HTML2PDF_SCRIPT_ID = 'devinks-html2pdf-script';
let html2pdfLoader;

export async function exportNotesAsPdf(notes, exportContainer) {
  const html2pdf = await loadHtml2Pdf();

  exportContainer.innerHTML = buildExportHtml(notes);

  try {
    await html2pdf()
      .from(exportContainer.firstElementChild || exportContainer)
      .set({
        margin: 10,
        filename: 'devinks-notes.pdf',
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      })
      .save();
  } finally {
    exportContainer.innerHTML = '';
  }
}

function buildExportHtml(notes) {
  return `
    <div class="export-document">
      <h1 class="export-title">DevInks Notes Export</h1>
      ${notes.map(renderNoteSection).join('')}
    </div>
  `;
}

function renderNoteSection(note) {
  const noteDate = formatNoteDate(note);

  return `
    <section class="export-note">
      <div class="export-note-meta">
        <div class="export-note-url">${escapeHtml(note.url || '')}</div>
        ${noteDate ? `<div class="export-note-date">${noteDate}</div>` : ''}
      </div>
      <div class="export-note-divider"></div>
      <div class="export-note-cells">
        ${(note.cells || []).map(renderCell).join('')}
      </div>
    </section>
  `;
}

function renderCell(cell) {
  if (!cell || !cell.content || !cell.content.trim()) {
    return '';
  }

  if (cell.cellType === 'code') {
    return `<pre class="export-code"><code>${escapeHtml(cell.content)}</code></pre>`;
  }

  return `<div class="export-md">${parseMarkdown(cell.content)}</div>`;
}

function escapeHtml(text) {
  return (text || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatNoteDate(note) {
  const timestamp = getNoteCreatedTimestamp(note);

  if (timestamp == null) {
    return '';
  }

  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

async function loadHtml2Pdf() {
  if (window.html2pdf) {
    return window.html2pdf;
  }

  if (!html2pdfLoader) {
    html2pdfLoader = new Promise((resolve, reject) => {
      const existingScript = document.getElementById(HTML2PDF_SCRIPT_ID);

      if (existingScript) {
        existingScript.addEventListener(
          'load',
          () => resolve(window.html2pdf),
          {
            once: true,
          },
        );
        existingScript.addEventListener(
          'error',
          () => reject(new Error('Failed to load html2pdf.js')),
          { once: true },
        );
        return;
      }

      const script = document.createElement('script');
      script.id = HTML2PDF_SCRIPT_ID;
      script.src = new URL(
        '../vendor/html2pdf.bundle.min.js',
        import.meta.url,
      ).href;
      script.onload = () => {
        if (window.html2pdf) {
          resolve(window.html2pdf);
          return;
        }
        reject(new Error('html2pdf.js did not initialize'));
      };
      script.onerror = () => reject(new Error('Failed to load html2pdf.js'));
      document.head.appendChild(script);
    });
  }

  return html2pdfLoader;
}
