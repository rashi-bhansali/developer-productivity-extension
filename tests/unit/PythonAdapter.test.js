import {
  checkSyntax,
  highlight,
} from '../../src/js/components/CodeEditor/languages/python.js';

describe('Python checkSyntax', () => {
  describe('clean code', () => {
    it('should return no errors for empty string', () => {
      expect(checkSyntax('')).toEqual([]);
    });

    it('should return no errors for valid python', () => {
      const code = `def greet(name):
    print(name)

greet("Alice")`;
      expect(checkSyntax(code)).toEqual([]);
    });

    it('should return no errors for comments', () => {
      const code = `# this is a comment
x = 10`;
      expect(checkSyntax(code)).toEqual([]);
    });
  });

  describe('missing colon', () => {
    it('should detect missing colon after if', () => {
      const code = `if x > 0\n    print(x)`;
      const errors = checkSyntax(code);
      expect(errors.some((e) => e.message.includes('colon'))).toBe(true);
    });

    it('should detect missing colon after def', () => {
      const code = `def greet(name)\n    print(name)`;
      const errors = checkSyntax(code);
      expect(errors.some((e) => e.message.includes('colon'))).toBe(true);
    });

    it('should detect missing colon after for', () => {
      const code = `for i in range(10)\n    print(i)`;
      const errors = checkSyntax(code);
      expect(errors.some((e) => e.message.includes('colon'))).toBe(true);
    });

    it('should not flag colon errors on valid lines', () => {
      const code = `if x > 0:\n    print(x)`;
      const errors = checkSyntax(code);
      expect(errors.some((e) => e.message.includes('colon'))).toBe(false);
    });
  });

  describe('indentation', () => {
    it('should detect inconsistent indentation', () => {
      const code = `def greet():\n   print("hello")`; // 3 spaces instead of 4
      const errors = checkSyntax(code);
      expect(errors.some((e) => e.message.includes('indentation'))).toBe(true);
    });

    it('should not flag correct 4-space indentation', () => {
      const code = `def greet():\n    print("hello")`;
      const errors = checkSyntax(code);
      expect(errors.some((e) => e.message.includes('indentation'))).toBe(false);
    });
  });

  describe('brackets', () => {
    it('should detect unclosed parenthesis', () => {
      const code = `print("hello"`;
      const errors = checkSyntax(code);
      expect(errors.some((e) => e.message.includes('('))).toBe(true);
    });

    it('should detect unbalanced closing bracket', () => {
      const code = `x = [1, 2, 3])`;
      const errors = checkSyntax(code);
      expect(errors.some((e) => e.message.includes('bracket'))).toBe(true);
    });

    it('should not flag balanced brackets', () => {
      const code = `x = [1, 2, 3]`;
      const errors = checkSyntax(code);
      expect(errors.some((e) => e.message.includes('bracket'))).toBe(false);
    });
  });
});

describe('Python highlight', () => {
  it('should return empty string for null input', () => {
    expect(highlight(null)).toBe('');
  });

  it('should wrap keywords in keyword spans', () => {
    const result = highlight('if x > 0:');
    expect(result).toContain('class="token keyword"');
  });

  it('should wrap strings in string spans', () => {
    const result = highlight('x = "hello"');
    expect(result).toContain('class="token string"');
  });

  it('should wrap comments in comment spans', () => {
    const result = highlight('# this is a comment');
    expect(result).toContain('class="token comment"');
  });

  it('should wrap numbers in number spans', () => {
    const result = highlight('x = 42');
    expect(result).toContain('class="token number"');
  });

  it('should wrap function calls in function spans', () => {
    const result = highlight('myCustomFunction()');
    expect(result).toContain('class="token function"');
  });
});
