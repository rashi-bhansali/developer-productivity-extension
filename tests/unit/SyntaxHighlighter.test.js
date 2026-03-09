import {
  commonSyntaxChecks,
  escapeHtml,
} from '../../src/js/utils/syntaxUtils.js';
import { applySyntaxHighlightingWithErrors } from '../../src/js/components/CodeEditor/SyntaxHighlighter.js';

// --- commonSyntaxChecks ---

const jsPatterns = {
  comment: /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm,
};

const pythonPatterns = {
  comment: /\s*#.*/,
};

describe('commonSyntaxChecks', () => {
  describe('balanced brackets', () => {
    it('should return no errors for balanced parentheses', () => {
      expect(commonSyntaxChecks('(x + y)', { patterns: jsPatterns })).toEqual(
        [],
      );
    });

    it('should return no errors for balanced curly braces', () => {
      expect(
        commonSyntaxChecks('function test() {}', { patterns: jsPatterns }),
      ).toEqual([]);
    });

    it('should return no errors for balanced square brackets', () => {
      expect(
        commonSyntaxChecks('const x = [1, 2, 3];', { patterns: jsPatterns }),
      ).toEqual([]);
    });

    it('should return no errors for nested balanced brackets', () => {
      const code = `function test() {\n    const x = [1, (2 + 3)];\n}`;
      expect(commonSyntaxChecks(code, { patterns: jsPatterns })).toEqual([]);
    });
  });

  describe('unclosed brackets', () => {
    it('should detect unclosed parenthesis', () => {
      const errors = commonSyntaxChecks('function broken(', {
        patterns: jsPatterns,
      });
      expect(errors.some((e) => e.message.includes('('))).toBe(true);
    });

    it('should detect unclosed curly brace', () => {
      const errors = commonSyntaxChecks('function test() {', {
        patterns: jsPatterns,
      });
      expect(errors.some((e) => e.message.includes('{'))).toBe(true);
    });

    it('should detect unclosed square bracket', () => {
      const errors = commonSyntaxChecks('const x = [1, 2, 3;', {
        patterns: jsPatterns,
      });
      expect(errors.some((e) => e.message.includes('['))).toBe(true);
    });
  });

  describe('unbalanced closing brackets', () => {
    it('should detect extra closing parenthesis', () => {
      const errors = commonSyntaxChecks('const x = (1 + 2));', {
        patterns: jsPatterns,
      });
      expect(errors.some((e) => e.message.includes('bracket'))).toBe(true);
    });

    it('should detect extra closing square bracket', () => {
      const errors = commonSyntaxChecks('const x = [1, 2]];', {
        patterns: jsPatterns,
      });
      expect(errors.some((e) => e.message.includes('bracket'))).toBe(true);
    });
  });

  describe('brackets inside comments are ignored', () => {
    it('should ignore brackets in single-line JS comments', () => {
      const code = `// function broken( {\nconst x = 10;`;
      expect(commonSyntaxChecks(code, { patterns: jsPatterns })).toEqual([]);
    });

    it('should ignore brackets in multi-line JS comments', () => {
      const code = `/* function broken( { */\nconst x = 10;`;
      expect(commonSyntaxChecks(code, { patterns: jsPatterns })).toEqual([]);
    });

    it('should ignore brackets in Python comments', () => {
      const code = `# function broken(\nx = 10`;
      expect(commonSyntaxChecks(code, { patterns: pythonPatterns })).toEqual(
        [],
      );
    });
  });

  describe('line number tracking', () => {
    it('should report correct line for unclosed bracket', () => {
      const code = `const x = 10;\nfunction broken(`;
      const errors = commonSyntaxChecks(code, { patterns: jsPatterns });
      const bracketError = errors.find((e) => e.message.includes('('));
      expect(bracketError.line).toBe(2); //1-indexed (second line)
    });

    it('should report line 1 for bracket on first line', () => {
      const code = `function broken(`;
      const errors = commonSyntaxChecks(code, { patterns: jsPatterns });
      const bracketError = errors.find((e) => e.message.includes('('));
      expect(bracketError.line).toBe(1); //1-indexed (first line)
    });
  });
});

// --- escapeHtml ---
describe('escapeHtml', () => {
  it('should return empty string for null', () => {
    expect(escapeHtml(null)).toBe('');
  });

  it('should return empty string for non-string input', () => {
    expect(escapeHtml(123)).toBe('');
  });

  it('should escape ampersand', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b');
  });

  it('should escape less than', () => {
    expect(escapeHtml('<div>')).toBe('&lt;div&gt;');
  });

  it('should escape greater than', () => {
    expect(escapeHtml('x > 0')).toBe('x &gt; 0');
  });

  it('should escape double quotes', () => {
    expect(escapeHtml('"hello"')).toBe('&quot;hello&quot;');
  });

  it('should escape single quotes', () => {
    expect(escapeHtml("it's")).toBe('it&#39;s');
  });

  it('should escape multiple special characters in one string', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
    );
  });

  it('should return plain string unchanged', () => {
    expect(escapeHtml('hello world')).toBe('hello world');
  });

  it('should handle empty string', () => {
    expect(escapeHtml('')).toBe('');
  });
});

// --- applySyntaxHighlightingWithErrors ---

describe('applySyntaxHighlightingWithErrors', () => {
  describe('unknown language', () => {
    it('should return escaped HTML for unknown language', () => {
      const result = applySyntaxHighlightingWithErrors('<script>', 'unknown');
      expect(result).toContain('&lt;script&gt;');
      expect(result).not.toContain('<script>');
    });

    it('should return escaped HTML for null language', () => {
      const result = applySyntaxHighlightingWithErrors('hello', null);
      expect(result).toBe('hello');
    });
  });

  describe('error spans', () => {
    it('should contain error spans when errors exist', () => {
      const code = `var x = 10;`; // triggers var warning in JS
      const result = applySyntaxHighlightingWithErrors(code, 'javascript');
      expect(result).toContain('class="error"');
      expect(result).toContain('data-tooltip');
    });

    it('should not contain error spans for clean code', () => {
      const code = `const x = 10;`;
      const result = applySyntaxHighlightingWithErrors(code, 'javascript');
      expect(result).not.toContain('class="error"');
    });

    it('should contain error spans for python missing colon', () => {
      const code = `if x > 0\n    print(x)`;
      const result = applySyntaxHighlightingWithErrors(code, 'python');
      expect(result).toContain('class="error"');
    });

    it('should not contain error spans for valid python', () => {
      const code = `x = 10\nprint(x)`;
      const result = applySyntaxHighlightingWithErrors(code, 'python');
      expect(result).not.toContain('class="error"');
    });

    it('should include error message in data-tooltip', () => {
      const code = `var x = 10;`;
      const result = applySyntaxHighlightingWithErrors(code, 'javascript');
      expect(result).toContain("Avoid 'var'");
    });
  });

  describe('highlight tokens', () => {
    it('should contain token spans for python keywords', () => {
      const result = applySyntaxHighlightingWithErrors('if x > 0:', 'python');
      expect(result).toContain('class="token keyword"');
    });

    it('should contain token spans for javascript keywords', () => {
      const result = applySyntaxHighlightingWithErrors(
        'const x = 10;',
        'javascript',
      );
      expect(result).toContain('class="token keyword"');
    });

    it('should contain token spans for cpp keywords', () => {
      const result = applySyntaxHighlightingWithErrors('int x = 10;', 'cpp');
      expect(result).toContain('class="token keyword"');
    });
  });

  describe('empty and edge cases', () => {
    it('should handle empty string for python', () => {
      const result = applySyntaxHighlightingWithErrors('', 'python');
      expect(result).toBe('');
    });

    it('should handle empty string for javascript', () => {
      const result = applySyntaxHighlightingWithErrors('', 'javascript');
      expect(result).toBe('');
    });

    it('should escape HTML special characters', () => {
      const result = applySyntaxHighlightingWithErrors(
        '<script>alert(1)</script>',
        'javascript',
      );
      expect(result).not.toContain('<script>alert(1)</script>'); // structure should get broken up by token spans
    });
  });
});
