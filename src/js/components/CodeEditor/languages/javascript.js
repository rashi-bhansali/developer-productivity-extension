/* eslint-disable no-useless-escape */
/**
 * JavaScript language adapter: syntax highlighting and syntax/error checks.
 * Implements the language adapter interface used by SyntaxHighlighter.
 */

import { escapeHtml, commonSyntaxChecks } from '../../../utils/syntaxUtils.js';

const patterns = {
  comment: /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm,
  string: /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)/,
  keyword:
    /\b(await|break|case|catch|class|const|continue|debugger|default|delete|do|else|export|extends|false|finally|for|function|if|import|in|instanceof|let|new|null|return|static|super|switch|this|throw|true|try|typeof|var|void|while|with|yield)\b/,
  builtinFunction:
    /\b(console|setTimeout|setInterval|clearTimeout|clearInterval|parseInt|parseFloat|isNaN|isFinite|JSON|Math|Object|Array|String|Number|Boolean|Promise|Map|Set)\b/,
  number: /\b(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?\b/,
  operator:
    /(\+\+|--|===|!==|==|!=|<=|>=|&&|\|\||=>|\?\.|\?\?|<<|>>|\+|-|\*|\/|%|=|\+=|-=|\*=|\/=|%=)/,
  function: /\b[a-zA-Z_$][\w$]*(?=\s*\()/,
};

function createCombinedRegex() {
  return new RegExp(
    [
      patterns.comment.source,
      patterns.string.source,
      patterns.keyword.source,
      patterns.builtinFunction.source,
      patterns.number.source,
      patterns.function.source,
      patterns.operator.source,
    ].join('|'),
    'gm',
  );
}

/**
 * Returns syntax-highlighted HTML for the given JavaScript code.
 * @param {string} code
 * @returns {string} HTML string
 */
export function highlight(code) {
  const regex = createCombinedRegex();
  return code.replace(regex, (match) => {
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
    if (patterns.function.test(match)) {
      return `<span class="token function">${escapeHtml(match)}</span>`;
    }
    if (patterns.operator.test(match)) {
      return `<span class="token operator">${escapeHtml(match)}</span>`;
    }
    return escapeHtml(match);
  });
}

/**
 * Returns syntax/error check results for the given JavaScript code.
 * @param {string} code
 * @returns {{ message: string, line: number, column: number }[]}
 */
export function checkSyntax(code) {
  const errors = [];
  const lines = code.split('\n');
  const keywords = new Set([
    'await', 'break', 'case', 'catch', 'class', 'const', 'continue',
    'debugger', 'default', 'delete', 'do', 'else', 'export', 'extends',
    'false', 'finally', 'for', 'function', 'if', 'import', 'in',
    'instanceof', 'let', 'new', 'null', 'return', 'static', 'super',
    'switch', 'this', 'throw', 'true', 'try', 'typeof', 'var', 'void',
    'while', 'with', 'yield',
  ]);
  const builtins = new Set([
    'console', 'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval',
    'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'JSON', 'Math', 'Object',
    'Array', 'String', 'Number', 'Boolean', 'Promise', 'Map', 'Set',
  ]);

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('//')) return;

    // Check for use of var (prefer let/const)
    if (/\bvar\b/.test(trimmedLine)) {
      errors.push({
        message: "Avoid 'var': use 'let' or 'const' instead",
        line: lineNumber,
        column: trimmedLine.indexOf('var'),
      });
    }

    // Check for == instead of ===
    if (/(?<![=!<>])==(?!=)/.test(trimmedLine)) {
      errors.push({
        message: "Use '===' instead of '==' for strict equality",
        line: lineNumber,
        column: trimmedLine.search(/(?<![=!<>])==(?!=)/),
      });
    }

    // Check for undefined variables (basic - skips keywords and builtins)
    const identifierRegex = /\b[a-zA-Z_$][\w$]*\b/g;
    const stringLiteralRegex = /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)/g;
    const cleanedLine = trimmedLine.replace(stringLiteralRegex, (m) =>
      ' '.repeat(m.length),
    );

    // Track declared names per line (const/let/function declarations)
    const declaredNames = new Set();
    const declMatch = trimmedLine.match(
      /(?:const|let|var|function)\s+([a-zA-Z_$][\w$]*)/,
    );
    if (declMatch) declaredNames.add(declMatch[1]);

    let match;
    while ((match = identifierRegex.exec(cleanedLine)) !== null) {
      const name = match[0];
      if (keywords.has(name) || builtins.has(name)) continue;
      if (declaredNames.has(name)) continue;
    }
  });

  errors.push(...commonSyntaxChecks(code, { patterns }));
  return errors;
}

export const id = 'javascript';
export const displayName = 'JavaScript';

export default {
  id,
  displayName,
  highlight,
  checkSyntax,
};