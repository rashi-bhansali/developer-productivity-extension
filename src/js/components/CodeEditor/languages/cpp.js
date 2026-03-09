/* eslint-disable no-useless-escape */
/**
 * C++ language adapter: syntax highlighting and syntax/error checks.
 * Implements the language adapter interface used by SyntaxHighlighter.
 */

import { escapeHtml, commonSyntaxChecks } from '../../../utils/syntaxUtils.js';

const patterns = {
  comment: /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)/,
  string: /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/,
  keyword:
    /\b(alignas|alignof|and|and_eq|asm|auto|bitand|bitor|bool|break|case|catch|char|char8_t|char16_t|char32_t|class|compl|concept|const|consteval|constexpr|constinit|const_cast|continue|co_await|co_return|co_yield|decltype|default|delete|do|double|dynamic_cast|else|enum|explicit|export|extern|false|float|for|friend|goto|if|inline|int|long|mutable|namespace|new|noexcept|not|not_eq|nullptr|operator|or|or_eq|private|protected|public|register|reinterpret_cast|requires|return|short|signed|sizeof|static|static_assert|static_cast|struct|switch|template|this|thread_local|throw|true|try|typedef|typeid|typename|union|unsigned|using|virtual|void|volatile|wchar_t|while|xor|xor_eq)\b/,
  builtinFunction:
    /\b(cout|cin|cerr|endl|printf|scanf|malloc|free|new|delete|std|vector|string|map|set|pair|make_pair|push_back|pop_back|size|begin|end|sort|find|insert|erase)\b/,
  number: /\b(\d+\.?\d*)([eE][-+]?\d+)?([uUlLfF]{0,2})\b/,
  preprocessor:
    /^#\s*(include|define|ifdef|ifndef|endif|pragma|undef|if|else|elif)[^\n]*/m,
  operator:
    /(\+\+|--|->|\*|&|::|\+=|-=|\*=|\/=|%=|==|!=|<=|>=|&&|\|\||<<|>>|[+\-\/%<>=!])/,
  function: /\b[a-zA-Z_]\w*(?=\s*\()/,
};

function createCombinedRegex() {
  return new RegExp(
    [
      patterns.comment.source,
      patterns.preprocessor.source,
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
 * Returns syntax-highlighted HTML for the given C++ code.
 * @param {string} code
 * @returns {string} HTML string
 */
export function highlight(code) {
  if (code == null || typeof code !== 'string') return ''; //edge case identified while testing
  const regex = createCombinedRegex();
  return code.replace(regex, (match) => {
    if (patterns.comment.test(match)) {
      return `<span class="token comment">${escapeHtml(match)}</span>`;
    }
    if (patterns.preprocessor.test(match)) {
      return `<span class="token preprocessor">${escapeHtml(match)}</span>`;
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

function stripCommentsWithState(line, inBlockComment) {
  let result = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;
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

    if (char === '\\' && (inSingleQuote || inDoubleQuote)) {
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

    result += char;
  }

  return { strippedLine: result, inBlockComment };
}

function extractCppParameterNames(parameters) {
  const names = new Set();
  parameters
    .split(',')
    .map((parameter) => parameter.trim().split('=')[0].trim())
    .filter(Boolean)
    .forEach((parameter) => {
      const cleanedParameter = parameter.replace(/^[*&\s]+/, '');
      const tokens = cleanedParameter.match(/[a-zA-Z_]\w*/g) || [];
      const candidate = tokens[tokens.length - 1];
      if (candidate) names.add(candidate);
    });
  return names;
}

function collectDeclarations(line, declaredNames, knownTypeNames) {
  const trimmedLine = line.trim();
  if (!trimmedLine || trimmedLine.startsWith('#')) return;

  const classMatch = trimmedLine.match(/\b(?:class|struct)\s+([a-zA-Z_]\w*)/);
  if (classMatch) {
    knownTypeNames.add(classMatch[1]);
  }

  const functionMatch = trimmedLine.match(
    /^(?!if\b|for\b|while\b|switch\b|catch\b)(?:[a-zA-Z_]\w*(?:::[a-zA-Z_]\w*)*(?:<[^>]*>)?[\s*&]+)+([a-zA-Z_]\w*)\s*\(([^)]*)\)\s*(?:const\b)?\s*(?:\{|;)/,
  );
  if (functionMatch) {
    declaredNames.add(functionMatch[1]);
    extractCppParameterNames(functionMatch[2]).forEach((name) =>
      declaredNames.add(name),
    );
  }

  const forDeclarationMatch = trimmedLine.match(
    /\bfor\s*\(\s*(?:const\s+)?(?:[a-zA-Z_]\w*(?:::[a-zA-Z_]\w*)*(?:<[^>]*>)?[\s*&]+)+([a-zA-Z_]\w*)\b/,
  );
  if (forDeclarationMatch) {
    declaredNames.add(forDeclarationMatch[1]);
  }

  if (
    /^(return|using|namespace|typedef|if|else|for|while|switch|do|try|catch)\b/.test(
      trimmedLine,
    )
  ) {
    return;
  }

  const declarationMatch = trimmedLine.match(
    /^(?:const\s+)?(?:(?:unsigned|signed|long|short|static|constexpr|volatile|mutable|register|auto)\s+)*(?:[a-zA-Z_]\w*(?:::[a-zA-Z_]\w*)*(?:<[^;{}()]*>)?)\s+([^;]+);$/,
  );
  if (!declarationMatch) return;

  declarationMatch[1]
    .split(',')
    .map((segment) => segment.split('=')[0].trim())
    .forEach((segment) => {
      const nameMatch = segment
        .replace(/^[*&\s]+/, '')
        .match(/^([a-zA-Z_]\w*)/);
      if (nameMatch) declaredNames.add(nameMatch[1]);
    });
}

/**
 * Returns syntax/error check results for the given C++ code.
 * @param {string} code
 * @returns {{ message: string, line: number, column: number }[]}
 */
export function checkSyntax(code) {
  const errors = [];
  const rawLines = code.split('\n');
  const strippedLines = [];
  const declaredNames = new Set();
  const knownTypeNames = new Set([
    'int',
    'long',
    'short',
    'float',
    'double',
    'char',
    'bool',
    'void',
    'string',
    'size_t',
    'auto',
    'vector',
    'map',
    'set',
    'pair',
    'std',
    'wchar_t',
    'char8_t',
    'char16_t',
    'char32_t',
  ]);

  let inBlockComment = false;
  rawLines.forEach((line) => {
    const { strippedLine, inBlockComment: nextInBlockComment } =
      stripCommentsWithState(line, inBlockComment);
    inBlockComment = nextInBlockComment;
    strippedLines.push(strippedLine);
    collectDeclarations(strippedLine, declaredNames, knownTypeNames);
  });

  strippedLines.forEach((line, index) => {
    const lineNumber = index + 1;
    const codeOnly = line.trim();
    if (!codeOnly) return; // line was entirely a comment

    // Check for missing semicolons on lines that should have them
    const needsSemicolon =
      !codeOnly.endsWith(';') &&
      !codeOnly.endsWith('{') &&
      !codeOnly.endsWith('}') &&
      !codeOnly.endsWith(':') &&
      !codeOnly.startsWith('#') &&
      !codeOnly.startsWith('*') &&
      !/^(if|else|for|while|do|switch|try|catch|class|struct|namespace)\b/.test(
        codeOnly,
      );

    if (needsSemicolon) {
      errors.push({
        message: 'Possible missing semicolon',
        line: lineNumber,
        column: line.length,
      });
    }

    // Warn about printf without format specifier safety
    if (/\bprintf\s*\(\s*[^")][^)]*\)/.test(codeOnly)) {
      errors.push({
        message: 'printf with non-literal format string may be unsafe',
        line: lineNumber,
        column: codeOnly.indexOf('printf'),
      });
    }

    // Undefined variable check
    if (codeOnly.startsWith('#')) return;

    const cleanedLine = codeOnly.replace(
      /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/g,
      (match) => ' '.repeat(match.length),
    );
    const identifierRegex = /[a-zA-Z_]\w*/g;
    const lineSeenNames = new Set();
    let match;
    while ((match = identifierRegex.exec(cleanedLine)) !== null) {
      const name = match[0];
      if (
        patterns.keyword.test(name) ||
        patterns.builtinFunction.test(name) ||
        declaredNames.has(name) ||
        knownTypeNames.has(name) ||
        /^[A-Z_][A-Z0-9_]*$/.test(name)
      ) {
        continue;
      }

      const charBefore = cleanedLine[match.index - 1] || '';
      const twoCharsBefore = cleanedLine.slice(
        Math.max(0, match.index - 2),
        match.index,
      );
      if (
        charBefore === '.' ||
        twoCharsBefore === '->' ||
        twoCharsBefore === '::'
      ) {
        continue;
      }

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

export const id = 'cpp';
export const displayName = 'C++';

export default {
  id,
  displayName,
  highlight,
  checkSyntax,
};
