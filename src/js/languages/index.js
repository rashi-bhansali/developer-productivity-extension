/**
 * Language adapter registry.
 * Register adapters here; UI uses getSupportedLanguages() for the dropdown,
 * and SyntaxHighlighter uses getAdapter(id) for highlight + checkSyntax.
 */

import pythonAdapter from './python.js';
import javascriptAdapter from './javascript.js';

const registry = {
  [pythonAdapter.id]: pythonAdapter,
  [javascriptAdapter.id]: javascriptAdapter,
};

/**
 * @returns {{ id: string, displayName: string }[]}
 */
export function getSupportedLanguages() {
  return Object.values(registry).map(({ id, displayName }) => ({
    id,
    displayName,
  }));
}

/**
 * @param {string} languageId
 * @returns {{ id: string, displayName: string, highlight: (code: string) => string, checkSyntax: (code: string) => { message: string, line: number, column: number }[] } | undefined}
 */
export function getAdapter(languageId) {
  return registry[languageId];
}
