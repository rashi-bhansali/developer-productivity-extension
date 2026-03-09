/**
 * Shared utilities for syntax highlighting and checking.
 * Used by SyntaxHighlighter and language adapters to avoid circular dependencies.
 */

export const escapeHtml = (str) => {
  if (str == null || typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

/**
 * Common syntax checks (e.g. unbalanced brackets). Requires rules with .patterns.comment.
 * @param {string} code
 * @param {{ patterns: { comment: RegExp } }} rules
 * @returns {{ message: string, line: number, column: number }[]}
 */
export const commonSyntaxChecks = (code, rules) => {
  const errors = [];
  const cleanCode = code.replace(rules.patterns.comment, '');
  const bracketPairs = { '(': ')', '[': ']', '{': '}' };
  const brackets = { '(': 0, '[': 0, '{': 0 };
  const bracketLines = { '(': 1, '[': 1, '{': 1 }; //track line where opened

  let currentLine = 1;
  for (const char of cleanCode) {
    if (char === '\n') {
      currentLine++;
      continue;
    }
    if (char in brackets) {
      brackets[char]++;
      bracketLines[char] = currentLine; //update line when opened
    }
    if (Object.values(bracketPairs).includes(char)) {
      const openBracket = Object.keys(bracketPairs).find(
        (key) => bracketPairs[key] === char,
      );
      if (brackets[openBracket] > 0) brackets[openBracket]--;
      else {
        errors.push({
          message: `Unbalanced ${char} bracket`,
          line: currentLine,
          column: 0,
        });
      }
    }
  }

  Object.entries(brackets).forEach(([bracket, count]) => {
    if (count > 0) {
      errors.push({
        message: `Unclosed ${bracket} bracket`,
        line: bracketLines[bracket], //line where it was opened
        column: 0,
      });
    }
  });

  return errors;
};
