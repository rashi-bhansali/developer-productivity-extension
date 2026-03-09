import {
  checkSyntax,
  highlight,
} from '../../src/js/components/CodeEditor/languages/cpp.js';

describe('C++ checkSyntax', () => {
  describe('clean code', () => {
    it('should return no errors for empty string', () => {
      expect(checkSyntax('')).toEqual([]);
    });

    it('should return no errors for valid cpp', () => {
      const code = `#include <iostream>
using namespace std;

int main() {
    cout << "Hello" << endl;
    return 0;
}`;
      const errors = checkSyntax(code);
      expect(
        errors.filter(
          (e) =>
            e.message.includes('semicolon') || e.message.includes('printf'),
        ).length,
      ).toBe(0);
    });
  });

  describe('missing semicolon', () => {
    it('should detect missing semicolon on variable declaration', () => {
      const code = `int main() {\n    int x = 10\n    return 0;\n}`;
      const errors = checkSyntax(code);
      expect(errors.some((e) => e.message.includes('semicolon'))).toBe(true);
    });

    it('should not flag lines ending with {', () => {
      const code = `int main() {`;
      const errors = checkSyntax(code);
      expect(errors.some((e) => e.message.includes('semicolon'))).toBe(false);
    });

    it('should not flag lines ending with }', () => {
      const code = `int main() {\n    return 0;\n}`;
      const errors = checkSyntax(code);
      expect(errors.some((e) => e.message.includes('semicolon'))).toBe(false);
    });

    it('should not flag preprocessor directives', () => {
      const code = `#include <iostream>`;
      const errors = checkSyntax(code);
      expect(errors.some((e) => e.message.includes('semicolon'))).toBe(false);
    });

    it('should not flag if/for/while lines', () => {
      const code = `if (x > 0) {`;
      const errors = checkSyntax(code);
      expect(errors.some((e) => e.message.includes('semicolon'))).toBe(false);
    });

    it('should not flag comment lines', () => {
      const code = `// this is a comment`;
      const errors = checkSyntax(code);
      expect(errors.some((e) => e.message.includes('semicolon'))).toBe(false);
    });

    it('should not flag semicolon inside split block comments', () => {
      const code = `int main() {
/* int x = 10
still comment */
return 0;
}`;
      const errors = checkSyntax(code);
      expect(errors.some((e) => e.message.includes('semicolon'))).toBe(false);
    });
  });

  describe('printf safety', () => {
    it('should warn on printf with non-literal format string', () => {
      const code = `printf(userInput);`;
      const errors = checkSyntax(code);
      expect(errors.some((e) => e.message.includes('printf'))).toBe(true);
    });

    it('should not warn on printf with string literal', () => {
      const code = `printf("Hello %s", name);`;
      const errors = checkSyntax(code);
      expect(errors.some((e) => e.message.includes('printf'))).toBe(false);
    });
  });

  describe('brackets', () => {
    it('should detect unclosed parenthesis', () => {
      const code = `int main( {\n    return 0;\n}`;
      const errors = checkSyntax(code);
      expect(errors.some((e) => e.message.includes('('))).toBe(true);
    });

    it('should not flag balanced brackets', () => {
      const code = `int main() {\n    return 0;\n}`;
      const errors = checkSyntax(code);
      expect(errors.some((e) => e.message.includes('bracket'))).toBe(false);
    });
  });

  describe('undefined variable', () => {
    it('should warn on undefined identifiers', () => {
      const code = `int main() {\n    int x = 10;\n    return y;\n}`;
      const errors = checkSyntax(code);
      expect(
        errors.some((e) =>
          e.message.includes("Possible undefined variable 'y'"),
        ),
      ).toBe(true);
    });

    it('should not warn for declared identifiers', () => {
      const code = `int main() {\n    int x = 10;\n    return x;\n}`;
      const errors = checkSyntax(code);
      expect(errors.some((e) => e.message.includes('undefined variable'))).toBe(
        false,
      );
    });
  });
});

describe('C++ highlight', () => {
  it('should return empty string for null input', () => {
    expect(highlight(null)).toBe('');
  });

  it('should wrap keywords in keyword spans', () => {
    const result = highlight('int x = 10;');
    expect(result).toContain('class="token keyword"');
  });

  it('should wrap strings in string spans', () => {
    const result = highlight('cout << "hello";');
    expect(result).toContain('class="token string"');
  });

  it('should wrap preprocessor directives in preprocessor spans', () => {
    const result = highlight('#include <iostream>');
    expect(result).toContain('class="token preprocessor"');
  });

  it('should wrap single-line comments in comment spans', () => {
    const result = highlight('// this is a comment');
    expect(result).toContain('class="token comment"');
  });

  it('should wrap multi-line comments in comment spans', () => {
    const result = highlight('/* this is\na comment */');
    expect(result).toContain('class="token comment"');
  });

  it('should wrap numbers in number spans', () => {
    const result = highlight('int x = 42;');
    expect(result).toContain('class="token number"');
  });

  it('should wrap numbers with suffixes', () => {
    const result = highlight('long x = 42UL;');
    expect(result).toContain('class="token number"');
  });
});
