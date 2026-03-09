/**
 * JavaScript language adapter: syntax highlighting and syntax/error checks.
 * Implements the language adapter interface used by SyntaxHighlighter.
 */

import { escapeHtml, commonSyntaxChecks } from '../../../utils/syntaxUtils.js';

const patterns = {
  comment: /\/\/[^\n]*|\/\*[\s\S]*?\*\//,
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
      `(${patterns.function.source})`,
      patterns.operator.source,
    ].join('|'),
    'gms',
  );
}

/**
 * Returns syntax-highlighted HTML for the given JavaScript code.
 * @param {string} code
 * @returns {string} HTML string
 */
export function highlight(code) {
  if (code == null || typeof code !== 'string') return ''; //edge case identified while testing
  const regex = createCombinedRegex();
  return code.replace(regex, (match, _s, _kw, _bi, _n1, _n2, fnMatch) => {
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

function stripCommentsWithState(line, inBlockComment) {
  let result = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inTemplateLiteral = false;
  let escaped = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (inBlockComment) {
      if (char === '*' && nextChar === '/') {
        inBlockComment = false;
        result += '  ';
        i++;
      } else {
        result += ' ';
      }
      continue;
    }

    if (escaped) {
      result += char;
      escaped = false;
      continue;
    }

    if (
      char === '\\' &&
      (inSingleQuote || inDoubleQuote || inTemplateLiteral)
    ) {
      result += char;
      escaped = true;
      continue;
    }

    if (inSingleQuote) {
      result += char;
      if (char === "'") inSingleQuote = false;
      continue;
    }

    if (inDoubleQuote) {
      result += char;
      if (char === '"') inDoubleQuote = false;
      continue;
    }

    if (inTemplateLiteral) {
      result += char;
      if (char === '`') inTemplateLiteral = false;
      continue;
    }

    if (char === '/' && nextChar === '*') {
      inBlockComment = true;
      result += '  ';
      i++;
      continue;
    }

    if (char === '/' && nextChar === '/') {
      break;
    }

    if (char === "'") {
      inSingleQuote = true;
      result += char;
      continue;
    }

    if (char === '"') {
      inDoubleQuote = true;
      result += char;
      continue;
    }

    if (char === '`') {
      inTemplateLiteral = true;
      result += char;
      continue;
    }

    result += char;
  }

  return { strippedLine: result, inBlockComment };
}

function extractDeclaredNamesFromLine(line) {
  const names = new Set();

  const declarationRegex = /\b(?:const|let|var)\s+([^;]+)/g;
  let declarationMatch;
  while ((declarationMatch = declarationRegex.exec(line)) !== null) {
    declarationMatch[1]
      .split(',')
      .map((segment) => segment.trim())
      .forEach((segment) => {
        if (!segment) return;
        const basicName = segment.match(/^[a-zA-Z_$][\w$]*/);
        if (basicName) {
          names.add(basicName[0]);
          return;
        }
        const destructuredNames = segment.match(/[a-zA-Z_$][\w$]*/g) || [];
        destructuredNames.forEach((name) => names.add(name));
      });
  }

  const functionRegex = /\bfunction\s+([a-zA-Z_$][\w$]*)\s*\(([^)]*)\)/g;
  let functionMatch;
  while ((functionMatch = functionRegex.exec(line)) !== null) {
    names.add(functionMatch[1]);
    functionMatch[2]
      .split(',')
      .map((param) =>
        param
          .trim()
          .replace(/^\.\.\./, '')
          .split('=')[0]
          .trim(),
      )
      .filter((param) => /^[a-zA-Z_$][\w$]*$/.test(param))
      .forEach((param) => names.add(param));
  }

  // Support in-progress or malformed function declarations while typing,
  // e.g. "function broken(" so function names are not misreported as undefined.
  const partialFunctionRegex = /\bfunction\s+([a-zA-Z_$][\w$]*)\b/g;
  let partialFunctionMatch;
  while ((partialFunctionMatch = partialFunctionRegex.exec(line)) !== null) {
    names.add(partialFunctionMatch[1]);
  }

  const classRegex = /\bclass\s+([a-zA-Z_$][\w$]*)/g;
  let classMatch;
  while ((classMatch = classRegex.exec(line)) !== null) {
    names.add(classMatch[1]);
  }

  const catchRegex = /\bcatch\s*\(\s*([a-zA-Z_$][\w$]*)\s*\)/g;
  let catchMatch;
  while ((catchMatch = catchRegex.exec(line)) !== null) {
    names.add(catchMatch[1]);
  }

  return names;
}

/**
 * Returns syntax/error check results for the given JavaScript code.
 * @param {string} code
 * @returns {{ message: string, line: number, column: number }[]}
 */
export function checkSyntax(code) {
  const errors = [];
  const rawLines = code.split('\n');
  const keywords = new Set([
    'await',
    'break',
    'case',
    'catch',
    'class',
    'const',
    'continue',
    'debugger',
    'default',
    'delete',
    'do',
    'else',
    'export',
    'extends',
    'false',
    'finally',
    'for',
    'function',
    'if',
    'import',
    'in',
    'instanceof',
    'let',
    'new',
    'null',
    'return',
    'static',
    'super',
    'switch',
    'this',
    'throw',
    'true',
    'try',
    'typeof',
    'var',
    'void',
    'while',
    'with',
    'yield',
  ]);
  const builtins = new Set([
    'console',
    'setTimeout',
    'setInterval',
    'clearTimeout',
    'clearInterval',
    'parseInt',
    'parseFloat',
    'isNaN',
    'isFinite',
    'JSON',
    'Math',
    'Object',
    'Array',
    'String',
    'Number',
    'Boolean',
    'Promise',
    'Map',
    'Set',
  ]);
  const extraGlobals = new Set([
    'window',
    'document',
    'globalThis',
    'undefined',
    'NaN',
    'Infinity',
  ]);
  const declaredNames = new Set();
  const strippedLines = [];

  let inBlockComment = false;
  rawLines.forEach((line) => {
    const { strippedLine, inBlockComment: nextInBlockComment } =
      stripCommentsWithState(line, inBlockComment);
    inBlockComment = nextInBlockComment;
    strippedLines.push(strippedLine);
    extractDeclaredNamesFromLine(strippedLine).forEach((name) =>
      declaredNames.add(name),
    );
  });

  strippedLines.forEach((line, index) => {
    const lineNumber = index + 1;
    const trimmedLine = line.trim();
    if (!trimmedLine) return;

    const codeOnly = trimmedLine;

    // Check for use of var (prefer let/const)
    if (/\bvar\b/.test(codeOnly)) {
      errors.push({
        message: "Avoid 'var': use 'let' or 'const' instead",
        line: lineNumber,
        column: codeOnly.indexOf('var'),
      });
    }

    // Check for == instead of ===
    if (/(?<![=!<>])==(?!=)/.test(codeOnly)) {
      errors.push({
        message: "Use '===' instead of '==' for strict equality",
        line: lineNumber,
        column: codeOnly.search(/(?<![=!<>])==(?!=)/),
      });
    }

    // Undefined variable check
    const stringLiteralRegex =
      /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)/g;
    const cleanedLine = codeOnly.replace(stringLiteralRegex, (m) =>
      ' '.repeat(m.length),
    );
    const lineDeclaredNames = extractDeclaredNamesFromLine(codeOnly);
    const lineSeenNames = new Set();

    const identifierRegex = /[a-zA-Z_$][\w$]*/g;
    let match;
    while ((match = identifierRegex.exec(cleanedLine)) !== null) {
      const name = match[0];
      if (
        keywords.has(name) ||
        builtins.has(name) ||
        extraGlobals.has(name) ||
        declaredNames.has(name) ||
        lineDeclaredNames.has(name)
      ) {
        continue;
      }

      const charBefore = cleanedLine[match.index - 1] || '';
      const twoCharsBefore = cleanedLine.slice(
        Math.max(0, match.index - 2),
        match.index,
      );
      if (charBefore === '.' || twoCharsBefore === '?.') continue;

      let nextIndex = match.index + name.length;
      while (
        nextIndex < cleanedLine.length &&
        /\s/.test(cleanedLine[nextIndex])
      ) {
        nextIndex++;
      }
      if (cleanedLine[nextIndex] === ':') continue;

      const uniqueNameKey = `${lineNumber}:${name}`;
      if (lineSeenNames.has(uniqueNameKey)) continue;
      lineSeenNames.add(uniqueNameKey);
      errors.push({
        message: `Possible undefined variable '${name}'`,
        line: lineNumber,
        column: match.index,
      });
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
