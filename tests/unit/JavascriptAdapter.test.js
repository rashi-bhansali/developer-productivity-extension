import {
  checkSyntax,
  highlight,
} from '../../src/js/components/CodeEditor/languages/javascript.js';

describe('Javascript checkSyntax', () => {
  describe('clean code', () => {
    it('should return no errors for empty string', () => {
      expect(checkSyntax('')).toEqual([]);
    });

    it('should return no errors for valid javascript', () => {
      const code = `const x = 10;
function greet(name) {
    if (name === "Alice") {
        console.log("Hello " + name);
    }
}`;
      const errors = checkSyntax(code);
      expect(
        errors.filter(
          (e) => e.message.includes('var') || e.message.includes('==='),
        ).length,
      ).toBe(0);
    });
  });

  describe('var warning', () => {
    it('should warn on var declaration', () => {
      const code = `var x = 10;`;
      const errors = checkSyntax(code);
      expect(errors.some((e) => e.message.includes('var'))).toBe(true);
    });

    it('should report correct line number for var', () => {
      const code = `const y = 5;\nvar x = 10;`;
      const errors = checkSyntax(code);
      const varError = errors.find((e) => e.message.includes('var'));
      expect(varError.line).toBe(2);
    });

    it('should not warn on const', () => {
      const code = `const x = 10;`;
      const errors = checkSyntax(code);
      expect(errors.some((e) => e.message.includes('var'))).toBe(false);
    });

    it('should not warn on let', () => {
      const code = `let x = 10;`;
      const errors = checkSyntax(code);
      expect(errors.some((e) => e.message.includes('var'))).toBe(false);
    });
  });

  describe('== warning', () => {
    it('should warn on == comparison', () => {
      const code = `if (x == 10) {}`;
      const errors = checkSyntax(code);
      expect(errors.some((e) => e.message.includes('==='))).toBe(true);
    });

    it('should not warn on === comparison', () => {
      const code = `if (x === 10) {}`;
      const errors = checkSyntax(code);
      expect(errors.some((e) => e.message.includes('==='))).toBe(false);
    });

    it('should not warn on !== comparison', () => {
      const code = `if (x !== 10) {}`;
      const errors = checkSyntax(code);
      expect(errors.some((e) => e.message.includes('==='))).toBe(false);
    });

    it('should not warn on >= or <=', () => {
      const code = `if (x >= 10 && y <= 5) {}`;
      const errors = checkSyntax(code);
      expect(errors.some((e) => e.message.includes('==='))).toBe(false);
    });
  });

  describe('brackets', () => {
    it('should detect unclosed parenthesis', () => {
      const code = `function broken( {\n    return null;\n}`;
      const errors = checkSyntax(code);
      expect(errors.some((e) => e.message.includes('('))).toBe(true);
    });

    it('should detect unclosed curly brace', () => {
      const code = `function test() {\n    const x = 1;`;
      const errors = checkSyntax(code);
      expect(errors.some((e) => e.message.includes('{'))).toBe(true);
    });

    it('should not flag balanced brackets', () => {
      const code = `function test() {\n    const x = [1, 2, 3];\n}`;
      const errors = checkSyntax(code);
      expect(errors.some((e) => e.message.includes('bracket'))).toBe(false);
    });

    it('should not count brackets inside comments', () => {
      const code = `// function broken( {\nconst x = 10;`;
      const errors = checkSyntax(code);
      expect(errors.some((e) => e.message.includes('('))).toBe(false);
    });

    it('should not count brackets inside strings', () => {
      const code = `const x = "hello (world)";`;
      const errors = checkSyntax(code);
      expect(errors.some((e) => e.message.includes('bracket'))).toBe(false);
    });
  });
});

describe('Javascript highlight', () => {
  it('should return empty string for null input', () => {
    expect(highlight(null)).toBe('');
  });

  it('should wrap keywords in keyword spans', () => {
    const result = highlight('const x = 10;');
    expect(result).toContain('class="token keyword"');
  });

  it('should wrap strings in string spans', () => {
    const result = highlight('const x = "hello";');
    expect(result).toContain('class="token string"');
  });

  it('should wrap template literals in string spans', () => {
    const result = highlight('const x = `hello ${name}`;');
    expect(result).toContain('class="token string"');
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
    const result = highlight('const pi = 3.14;');
    expect(result).toContain('class="token number"');
  });

  it('should wrap function calls in function spans', () => {
    const result = highlight('myCustomFunction()');
    expect(result).toContain('class="token function"');
  });

  it('should not highlight Java-only keywords', () => {
    const result = highlight('synchronized');
    expect(result).not.toContain('class="token keyword"');
  });
});
