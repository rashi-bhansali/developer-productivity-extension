/* eslint-disable no-useless-escape */
/** Escape text so it is safe to inject into HTML (e.g. innerHTML). */

const syntaxRules = {
  python: {
    patterns: {
      comment: /\s*#.*/,
      string: /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/,
      keyword:
        /\b(and|as|assert|break|class|continue|def|del|elif|else|except|False|finally|for|from|global|if|import|in|is|lambda|None|nonlocal|not|or|pass|raise|return|True|try|while|with|yield)\b/,
      builtinFunction:
        /\b(print|len|range|type|int|str|float|list|dict|set|tuple|sum|min|max|abs|round|input)\b/,
      number: /\b(\d+(\.\d*)?|\.\d+)([eE][-+]?\d+)?\b/,
      operator:
        /(\+|\-|\*|\/|%|\*\*|==|!=|<=|>=|<|>|=|\+=|\-=|\*=|\/=|%=|\*\*=)/,
      function: /\b[a-zA-Z_]\w*(?=\s*\()/,
    },
  },
};

const escapeHtml = (str) => {
  if (str == null || typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};


export const newapplySyntaxHighlighting = (code) => {

  // Combine all regex patterns
  const createCombinedRegex = () => {
    const rules = syntaxRules.python.patterns;
    return new RegExp(
      [
        rules.comment.source,
        rules.string.source,
        rules.keyword.source,
        rules.builtinFunction.source,
        rules.number.source,
        rules.function.source,
        rules.operator.source,
      ].join('|'),
      'g',
    );
  };

  // Apply syntax highlighting
  const highlightedCode = code.replace(createCombinedRegex(), (match) => {
    const rules = syntaxRules.python.patterns;

    // Check and apply highlighting for different token types
    if (rules.comment.test(match)) {
      return `<span class="token comment">${escapeHtml(match)}</span>`;
    } else if (rules.string.test(match)) {
      return `<span class="token string">${escapeHtml(match)}</span>`;
    } else if (rules.keyword.test(match)) {
      return `<span class="token keyword">${match}</span>`;
    } else if (rules.builtinFunction.test(match)) {
      return `<span class="token builtin">${escapeHtml(match)}</span>`;
    } else if (rules.number.test(match)) {
      return `<span class="token number">${escapeHtml(match)}</span>`;
    } else if (rules.function.test(match)) {
      return `<span class="token function">${escapeHtml(match)}</span>`;
    } else if (rules.operator.test(match)) {
      return `<span class="token operator">${escapeHtml(match)}</span>`;
    }

    return escapeHtml(match);
  });

  return highlightedCode;
};

export const applySyntaxHighlightingWithErrors = (code, language) => {
  const syntaxHighlightedCode = newapplySyntaxHighlighting(code, language);
  const errors = checkSyntax(code, language);
  const highlightedWithErrors = highlightErrors(syntaxHighlightedCode, errors);

  return highlightedWithErrors;
};

const checkSyntax = (code, language) => {
  // Validate language support
  if (!syntaxRules[language]) {
    throw new Error(`Unsupported language: ${language}`);
  }


  const errors = [];
  const rules = syntaxRules[language];

  // Language-specific preprocessing and checks
  switch (language) {
    case 'python':
      errors.push(...checkPythonSyntax(code));
      break;
    case 'c':
    case 'cpp':
    case 'java':
    case 'js':
      errors.push(...checkCStyleSyntax(code));
      break;
    case 'html':
      errors.push(...checkHTMLSyntax(code, rules));
      break;
    case 'css':
      errors.push(...checkCSSSyntax(code));
      break;
  }

  // Common syntax checks across all languages
  errors.push(...commonSyntaxChecks(code, rules));

  return errors;
};

// Python-specific syntax checks
const checkPythonSyntax = (code) => {
  const errors = [];
  const lines = code.split('\n');

  // Very small “symbol table” for this snippet
  const keywords = new Set([
    'and', 'as', 'assert', 'break', 'class', 'continue', 'def', 'del', 'elif',
    'else', 'except', 'False', 'finally', 'for', 'from', 'global', 'if',
    'import', 'in', 'is', 'lambda', 'None', 'nonlocal', 'not', 'or', 'pass',
    'raise', 'return', 'True', 'try', 'while', 'with', 'yield',
  ]);
  const builtins = new Set([
    'print', 'len', 'range', 'type', 'int', 'str', 'float', 'list', 'dict',
    'set', 'tuple', 'sum', 'min', 'max', 'abs', 'round', 'input',
  ]);

  // Scope tracking for variable visibility
  const scopes = [{ indent: 0, names: new Set() }];
  const currentScope = () => scopes[scopes.length - 1];


  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const trimmedLine = line.trim();
    if(!trimmedLine || trimmedLine.startsWith('#')) return; //skip blank lines or comment-only lines
    
    let hasMissingQuoteError = false;
    const indentationLevel = line.length - line.trimLeft().length;
    // Adjust scope stack based on indentation
    while (scopes.length > 1 && indentationLevel < currentScope().indent) {
      scopes.pop();
    }
    if (indentationLevel > currentScope().indent) {
      scopes.push({ indent: indentationLevel, names: new Set() });
    }

    //1. Indentation check
    if (trimmedLine && indentationLevel % 4 !== 0) {
      errors.push({
        message: 'Inconsistent indentation (should be multiples of 4 spaces)',
        line: lineNumber,
        column: 0,
      });
    }

    //2. Colon check for control structures
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
    const needsColon = colonRequiredKeywords.some((keyword) =>
      trimmedLine.startsWith(keyword),
    );
    if (needsColon && !trimmedLine.endsWith(':')) {
      errors.push({
        message: 'Missing colon after control structure or definition',
        line: lineNumber,
        column: line.length,
      });
    }

    //3. Variable declaration check
    const assignMatch = trimmedLine.match(/^([a-zA-Z_]\w*)\s*=/);
    if (assignMatch) {
      currentScope().names.add(assignMatch[1]);
    }
    // for i in iterable:
    const forMatch = trimmedLine.match(/^for\s+([a-zA-Z_]\w*)\s+in\b/);
    if (forMatch) {
      currentScope().names.add(forMatch[1]);
    }
    // def func(a, b):
    const defMatch = trimmedLine.match(/^def\s+([a-zA-Z_]\w*)\s*\(([^)]*)\)\s*:/);
    if (defMatch) {
      const funcName = defMatch[1];
      currentScope().names.add(funcName);
      const argList = defMatch[2]
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s && /^[a-zA-Z_]\w*$/.test(s));
      argList.forEach((arg) => currentScope().names.add(arg));
    }

    //4. Missing quotes for literals (assignments and function calls)
    //Heuristic: one argument, contains whitespace, no comma, and no quotes
    // 4a. Assignment context: msg = hello world
    const assignRhsMatch = trimmedLine.match(/^[^#]*=\s*(.+)$/);
    if (assignRhsMatch) {
      // Strip off any trailing comment
      const rhs = assignRhsMatch[1].split('#')[0].trim();
      const hasQuotes = rhs.includes('"') || rhs.includes("'");
      // Heuristic: multiple words, only identifiers + spaces, no quotes
      const wordyLiteral =
        /^[a-zA-Z_]\w*(\s+[a-zA-Z_]\w*)+$/.test(rhs);
      if (!hasQuotes && wordyLiteral) {
        errors.push({
          message: 'Right-hand side looks like a string literal missing quotes',
          line: lineNumber,
          column: line.indexOf(rhs),
        });
      }
    }
    // 4b. Function-call arguments: foo(hello world)
    const callRegex = /([a-zA-Z_]\w*)\(([^()]*)\)/g;
    let callMatch;
    while ((callMatch = callRegex.exec(trimmedLine)) !== null) {
      const argsText = callMatch[2];
      const args = argsText
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean);
      for (const arg of args) {
        const hasQuotes = arg.includes('"') || arg.includes("'");
        const wordyLiteral =
          /^[a-zA-Z_]\w*(\s+[a-zA-Z_]\w*)+$/.test(arg);
        if (!hasQuotes && wordyLiteral) {
          errors.push({
            message: 'Argument looks like a string literal missing quotes',
            line: lineNumber,
            column: trimmedLine.indexOf(arg),
          });
          hasMissingQuoteError = true;
        }
      }
    }

    // 5) Possible undefined variables (simple heuristic)
    if (!hasMissingQuoteError) {       
        const identifierRegex = /\b[a-zA-Z_]\w*\b/g;
        
        // Remove string literals so we don't flag words inside quotes
        const stringLiteralRegex = /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/g;
        const cleanedForVars = trimmedLine.replace(
          stringLiteralRegex,
          (m) => ' '.repeat(m.length),
        );
        
        let match;
        // To avoid spamming multiple errors on obviously broken lines, we still check,
        // but you could choose to skip this if you already pushed a “missing quotes” error.
        while ((match = identifierRegex.exec(cleanedForVars)) !== null) {
          const name = match[0];
          // Skip keywords, builtins, and booleans/None
          if (
            keywords.has(name) ||
            builtins.has(name) ||
            name === 'True' ||
            name === 'False' ||
            name === 'None'
          ) {
            continue;
          }

          const isDeclaredSomewhere = scopes.some((scope) => scope.names.has(name),)
          if (isDeclaredSomewhere) {
            continue;
          }
          errors.push({
            message: `Possible undefined variable '${name}'`,
            line: lineNumber,
            column: match.index,
          });
      }
    }
  });
  return errors;
};

// C-style languages syntax checks (C, C++, Java, JavaScript)
const checkCStyleSyntax = (code) => {
  const errors = [];
  const lines = code.split('\n');

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();

    // Semicolon check
    if (
      trimmedLine &&
      !trimmedLine.endsWith(';') &&
      !trimmedLine.endsWith('{') &&
      !trimmedLine.endsWith('}') &&
      !trimmedLine.startsWith('//') &&
      !trimmedLine.startsWith('/*') &&
      !trimmedLine.startsWith('*')
    ) {
      errors.push({
        message: 'Missing semicolon',
        line: index + 1,
        column: line.length,
      });
    }
  });

  return errors;
};

// HTML syntax checks
const checkHTMLSyntax = (code, rules) => {
  const errors = [];
  const lines = code.split('\n');
  const tagStack = [];

  lines.forEach((line, index) => {
    const tagMatches = line.match(rules.patterns.tag) || [];

    tagMatches.forEach((tag) => {
      // Remove angle brackets and whitespace
      const cleanTag = tag.replace(/[<>]/g, '').trim().split(' ')[0];

      // Self-closing and void tags
      if (
        tag.endsWith('/>') ||
        ['br', 'img', 'input', 'hr', 'meta', 'link'].includes(cleanTag)
      ) {
        return;
      }

      // Closing tag
      if (tag.startsWith('</')) {
        if (
          tagStack.length === 0 ||
          tagStack[tagStack.length - 1] !== cleanTag
        ) {
          errors.push({
            message: `Unexpected or mismatched closing tag: ${cleanTag}`,
            line: index + 1,
            column: line.indexOf(tag),
          });
        } else {
          tagStack.pop();
        }
      }
      // Opening tag
      else if (!tag.startsWith('</')) {
        tagStack.push(cleanTag);
      }
    });
  });

  // Check for unclosed tags at the end
  if (tagStack.length > 0) {
    errors.push({
      message: `Unclosed HTML tags: ${tagStack.join(', ')}`,
      line: lines.length,
      column: lines[lines.length - 1].length,
    });
  }

  return errors;
};

// CSS syntax checks
const checkCSSSyntax = (code) => {
  const errors = [];
  const lines = code.split('\n');
  let inBlock = false;

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();

    // Check for mismatched braces
    const openBraceCount = (line.match(/\{/g) || []).length;
    const closeBraceCount = (line.match(/\}/g) || []).length;

    if (openBraceCount > 0) {
      if (inBlock) {
        errors.push({
          message: 'Unexpected opening brace',
          line: index + 1,
          column: line.indexOf('{'),
        });
      }
      inBlock = true;
    }

    if (closeBraceCount > 0) {
      if (!inBlock) {
        errors.push({
          message: 'Unexpected closing brace',
          line: index + 1,
          column: line.indexOf('}'),
        });
      }
      inBlock = false;
    }

    // Check for missing semicolons in property declarations
    if (
      inBlock &&
      trimmedLine.includes(':') &&
      !trimmedLine.endsWith(';') &&
      !trimmedLine.endsWith('{') &&
      !trimmedLine.endsWith('}')
    ) {
      errors.push({
        message: 'Missing semicolon in CSS property',
        line: index + 1,
        column: line.length,
      });
    }
  });

  return errors;
};

// Common syntax checks across all languages
const commonSyntaxChecks = (code, rules) => {
  const errors = [];

  // Remove comments from the code
  const cleanCode = code.replace(rules.patterns.comment, '');

  // Check for unbalanced brackets, parentheses, and braces
  const bracketPairs = {
    '(': ')',
    '[': ']',
    '{': '}',
  };

  const brackets = {
    '(': 0,
    '[': 0,
    '{': 0,
  };

  for (const char of cleanCode) {
    if (char in brackets) {
      brackets[char]++;
    }
    if (Object.values(bracketPairs).includes(char)) {
      const openBracket = Object.keys(bracketPairs).find(
        (key) => bracketPairs[key] === char,
      );
      if (brackets[openBracket] > 0) {
        brackets[openBracket]--;
      } else {
        errors.push({
          message: `Unbalanced ${char} bracket`,
          line: 0,
          column: 0,
        });
      }
    }
  }

  // Check for unbalanced brackets at the end
  Object.entries(brackets).forEach(([bracket, count]) => {
    if (count > 0) {
      errors.push({
        message: `Unclosed ${bracket} bracket`,
        line: 0,
        column: 0,
      });
    }
  });

  return errors;
};
const highlightErrors = (code, errors) => {
  const lines = code.split('\n');
  errors.forEach((error) => {
    // error.line is 1-based; convert to 0-based index
    const lineIndex = error.line - 1;
    if (lineIndex < 0 || lineIndex >= lines.length) return;

    const line = lines[lineIndex];
    lines[lineIndex] = line.replace(
      new RegExp(`(^\\s*)(${line.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'g'),
      (match, spaces, text) => {
        return `${spaces}<span class="error" data-tooltip="${error.message}">${text}</span>`;
      },
    );
  });

  return lines.join('\n');
};
