/* eslint-disable no-useless-escape */
/**
 * Python language adapter: syntax highlighting and syntax/error checks.
 * Implements the language adapter interface used by SyntaxHighlighter.
 */

import { escapeHtml, commonSyntaxChecks } from '../../../utils/syntaxUtils.js';

const patterns = {
  comment: /\s*#.*/,
  string: /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/,
  keyword:
    /\b(and|as|assert|break|class|continue|def|del|elif|else|except|False|finally|for|from|global|if|import|in|is|lambda|None|nonlocal|not|or|pass|raise|return|True|try|while|with|yield)\b/,
  builtinFunction:
    /\b(print|len|range|type|int|str|float|list|dict|set|tuple|sum|min|max|abs|round|input)\b/,
  number: /\b(\d+(\.\d*)?|\.\d+)([eE][-+]?\d+)?\b/,
  operator: /(\+|\-|\*|\/|%|\*\*|==|!=|<=|>=|<|>|=|\+=|\-=|\*=|\/=|%=|\*\*=)/,
  function: /\b[a-zA-Z_]\w*(?=\s*\()/,
};

function createCombinedRegex() {
  return new RegExp(
    [
      patterns.comment.source,
      patterns.string.source,
      patterns.keyword.source,
      patterns.builtinFunction.source,
      patterns.number.source,
      `(${patterns.function.source})`,
      patterns.operator.source,
    ].join('|'),
    'g',
  );
}

/**
 * Returns syntax-highlighted HTML for the given Python code.
 * @param {string} code
 * @returns {string} HTML string
 */
export function highlight(code) {
  if (code == null || typeof code !== 'string') return ''; //edge case identified while testing
  const regex = createCombinedRegex();
  return code.replace(regex, (match, _s, _kw, _bi, _n1, _n2, _n3, fnMatch) => {
    if (patterns.comment.test(match)) {
      return `<span class="token comment">${escapeHtml(match)}</span>`;
    }
    if (patterns.string.test(match)) {
      return `<span class="token string">${escapeHtml(match)}</span>`;
    }
    if (patterns.keyword.test(match)) {
      return `<span class="token keyword">${match}</span>`;
    }
    if (patterns.builtinFunction.test(match)) {
      return `<span class="token builtin">${escapeHtml(match)}</span>`;
    }
    if (patterns.number.test(match)) {
      return `<span class="token number">${escapeHtml(match)}</span>`;
    }
    if (fnMatch) {
      return `<span class="token function">${escapeHtml(match)}</span>`;
    }
    if (patterns.operator.test(match)) {
      return `<span class="token operator">${escapeHtml(match)}</span>`;
    }
    return escapeHtml(match);
  });
}

/**
 * Strips the comment portion from a line of Python code, respecting strings.
 * e.g. 'x = 1  # comment' -> 'x = 1  '
 * e.g. 'x = "he said # hi"' -> 'x = "he said # hi"' (# inside string preserved)
 */
function stripComment(line) {
  // Match strings (to skip # inside them) OR a bare # which starts a comment.
  // When we hit a bare #, return empty string to strip it and everything after.
  return line.replace(/(["'])(?:\\.|(?!\1)[^\\])*\1|#.*/g, (m) =>
    m.startsWith('#') ? '' : m,
  );
}

/**
 * Returns syntax/error check results for the given Python code.
 * @param {string} code
 * @returns {{ message: string, line: number, column: number }[]}
 */
export function checkSyntax(code) {
  const errors = [];
  const lines = code.split('\n');
  const keywords = new Set([
    'and',
    'as',
    'assert',
    'break',
    'class',
    'continue',
    'def',
    'del',
    'elif',
    'else',
    'except',
    'False',
    'finally',
    'for',
    'from',
    'global',
    'if',
    'import',
    'in',
    'is',
    'lambda',
    'None',
    'nonlocal',
    'not',
    'or',
    'pass',
    'raise',
    'return',
    'True',
    'try',
    'while',
    'with',
    'yield',
  ]);
  const builtins = new Set([
    'print',
    'len',
    'range',
    'type',
    'int',
    'str',
    'float',
    'list',
    'dict',
    'set',
    'tuple',
    'sum',
    'min',
    'max',
    'abs',
    'round',
    'input',
  ]);
  const scopes = [{ indent: 0, names: new Set() }];
  const currentScope = () => scopes[scopes.length - 1];

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const trimmedLine = line.trim();
    // Skip blank lines and pure comment lines
    if (!trimmedLine || trimmedLine.startsWith('#')) return;

    // Strip inline comment before running all checks
    const codeOnly = stripComment(trimmedLine).trim();
    if (!codeOnly) return; // line was only a comment after stripping

    let hasMissingQuoteError = false;
    const indentationLevel = line.length - line.trimStart().length;

    while (scopes.length > 1 && indentationLevel < currentScope().indent) {
      scopes.pop();
    }
    if (indentationLevel > currentScope().indent) {
      scopes.push({ indent: indentationLevel, names: new Set() });
    }

    if (indentationLevel % 4 !== 0) {
      errors.push({
        message: 'Inconsistent indentation (should be multiples of 4 spaces)',
        line: lineNumber,
        column: 0,
      });
    }

    // Colon check — run against codeOnly so trailing comments don't interfere
    const colonRequiredKeywords = [
      'def',
      'class',
      'if',
      'else',
      'elif',
      'for',
      'while',
      'try',
      'except',
      'finally',
    ];
    const needsColon = colonRequiredKeywords.some((k) =>
      codeOnly.startsWith(k),
    );
    if (needsColon && !codeOnly.endsWith(':')) {
      errors.push({
        message: 'Missing colon after control structure or definition',
        line: lineNumber,
        column: line.length,
      });
    }

    // Track declared names using codeOnly
    const assignMatch = codeOnly.match(/^([a-zA-Z_]\w*)\s*=/);
    if (assignMatch) currentScope().names.add(assignMatch[1]);
    const forMatch = codeOnly.match(/^for\s+([a-zA-Z_]\w*)\s+in\b/);
    if (forMatch) currentScope().names.add(forMatch[1]);
    const defMatch = codeOnly.match(/^def\s+([a-zA-Z_]\w*)\s*\(([^)]*)\)\s*:/);
    if (defMatch) {
      currentScope().names.add(defMatch[1]);
      defMatch[2]
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s && /^[a-zA-Z_]\w*$/.test(s))
        .forEach((arg) => currentScope().names.add(arg));
    }

    // Missing quotes check — run against codeOnly
    const assignRhsMatch = codeOnly.match(/^[^#]*=\s*(.+)$/);
    if (assignRhsMatch) {
      const rhs = assignRhsMatch[1].trim();
      const hasQuotes = rhs.includes('"') || rhs.includes("'");
      const wordyLiteral = /^[a-zA-Z_]\w*(\s+[a-zA-Z_]\w*)+$/.test(rhs);
      if (!hasQuotes && wordyLiteral) {
        errors.push({
          message: 'Right-hand side looks like a string literal missing quotes',
          line: lineNumber,
          column: line.indexOf(rhs),
        });
        hasMissingQuoteError = true;
      }
    }

    const callRegex = /([a-zA-Z_]\w*)\(([^()]*)\)/g;
    let callMatch;
    while ((callMatch = callRegex.exec(codeOnly)) !== null) {
      const args = callMatch[2]
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean);
      for (const arg of args) {
        const hasQuotes = arg.includes('"') || arg.includes("'");
        const wordyLiteral = /^[a-zA-Z_]\w*(\s+[a-zA-Z_]\w*)+$/.test(arg);
        if (!hasQuotes && wordyLiteral) {
          errors.push({
            message: 'Argument looks like a string literal missing quotes',
            line: lineNumber,
            column: codeOnly.indexOf(arg),
          });
          hasMissingQuoteError = true;
        }
      }
    }

    // Undefined variable check — run against codeOnly
    if (!hasMissingQuoteError) {
      const identifierRegex = /\b[a-zA-Z_]\w*\b/g;
      const stringLiteralRegex = /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/g;
      const cleanedForVars = codeOnly.replace(stringLiteralRegex, (m) =>
        ' '.repeat(m.length),
      );
      let match;
      while ((match = identifierRegex.exec(cleanedForVars)) !== null) {
        const name = match[0];
        if (
          keywords.has(name) ||
          builtins.has(name) ||
          name === 'True' ||
          name === 'False' ||
          name === 'None'
        )
          continue;
        if (scopes.some((scope) => scope.names.has(name))) continue;
        errors.push({
          message: `Possible undefined variable '${name}'`,
          line: lineNumber,
          column: match.index,
        });
      }
    }
  });

  errors.push(...commonSyntaxChecks(code, { patterns }));
  return errors;
}

export const id = 'python';
export const displayName = 'Python';

export default {
  id,
  displayName,
  highlight,
  checkSyntax,
};
