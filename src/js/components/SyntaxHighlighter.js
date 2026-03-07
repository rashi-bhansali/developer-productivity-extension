/**
 * Syntax highlighter orchestrator.
 * Uses language adapters (see languages/) for highlight and checkSyntax;
 * applies error markup via highlightErrors.
 */

import { getAdapter, getSupportedLanguages } from '../languages/index.js';
import { escapeHtml } from '../utils/syntaxUtils.js';

/**
 * Wrap error lines with .error spans for squiggly + tooltip.
 * @param {string} code - Syntax-highlighted HTML (with token spans)
 * @param {{ message: string, line: number, column: number }[]} errors
 * @returns {string} HTML with error spans
 */
function highlightErrors(code, errors) {
  const escapeAttr = (s) =>
    String(s)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  const lines = code.split('\n');
  errors.forEach((error) => {
    const lineIndex = error.line - 1;
    if (lineIndex < 0 || lineIndex >= lines.length) return;
    const line = lines[lineIndex];
    lines[lineIndex] = line.replace(
      new RegExp(
        `(^\\s*)(${line.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
        'g',
      ),
      (match, spaces, text) =>
        `${spaces}<span class="error" data-tooltip="${escapeAttr(error.message)}">${text}</span>`,
    );
  });
  return lines.join('\n');
}

/**
 * Returns syntax-highlighted HTML with error spans for the given language.
 * @param {string} code
 * @param {string} languageId - e.g. 'python'
 * @returns {string} HTML string
 */
export function applySyntaxHighlightingWithErrors(code, languageId) {
  const adapter = getAdapter(languageId);
  if (!adapter) {
    return escapeHtml(code);
  }
  const highlighted = adapter.highlight(code);
  const errors = adapter.checkSyntax(code);
  return highlightErrors(highlighted, errors);
}

export { getSupportedLanguages };
