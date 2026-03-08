/* eslint-disable no-useless-escape */
/**
 * C++ language adapter: syntax highlighting and syntax/error checks.
 * Implements the language adapter interface used by SyntaxHighlighter.
 */

import { escapeHtml, commonSyntaxChecks } from '../../../utils/syntaxUtils.js';

const patterns = {
  comment: /(\/\/.*$|\/\*[\s\S]*?\*\/)/m,
  string: /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/,
  keyword:
    /\b(alignas|alignof|and|and_eq|asm|auto|bitand|bitor|bool|break|case|catch|char|char8_t|char16_t|char32_t|class|compl|concept|const|consteval|constexpr|constinit|const_cast|continue|co_await|co_return|co_yield|decltype|default|delete|do|double|dynamic_cast|else|enum|explicit|export|extern|false|float|for|friend|goto|if|inline|int|long|mutable|namespace|new|noexcept|not|not_eq|nullptr|operator|or|or_eq|private|protected|public|register|reinterpret_cast|requires|return|short|signed|sizeof|static|static_assert|static_cast|struct|switch|template|this|thread_local|throw|true|try|typedef|typeid|typename|union|unsigned|using|virtual|void|volatile|wchar_t|while|xor|xor_eq)\b/,
  builtinFunction:
    /\b(cout|cin|cerr|endl|printf|scanf|malloc|free|new|delete|std|vector|string|map|set|pair|make_pair|push_back|pop_back|size|begin|end|sort|find|insert|erase)\b/,
  number: /\b(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?[uUlLfF]?\b/,
  preprocessor: /^#\s*(include|define|ifdef|ifndef|endif|pragma|undef|if|else|elif)[^\n]*/m,
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

/**
 * Returns syntax/error check results for the given C++ code.
 * @param {string} code
 * @returns {{ message: string, line: number, column: number }[]}
 */
export function checkSyntax(code) {
  const errors = [];
  const lines = code.split('\n');

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('//')) return;

    // Check for missing semicolons on lines that should have them
    const needsSemicolon =
      !trimmedLine.endsWith(';') &&
      !trimmedLine.endsWith('{') &&
      !trimmedLine.endsWith('}') &&
      !trimmedLine.endsWith(':') &&
      !trimmedLine.startsWith('#') &&
      !trimmedLine.startsWith('//') &&
      !trimmedLine.startsWith('*') &&
      !/^(if|else|for|while|do|switch|try|catch|class|struct|namespace)\b/.test(trimmedLine);

    if (needsSemicolon) {
      errors.push({
        message: 'Possible missing semicolon',
        line: lineNumber,
        column: line.length,
      });
    }

    // Warn about printf without format specifier safety
    if (/\bprintf\s*\(\s*[^")][^)]*\)/.test(trimmedLine)) {
      errors.push({
        message: 'printf with non-literal format string may be unsafe',
        line: lineNumber,
        column: trimmedLine.indexOf('printf'),
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