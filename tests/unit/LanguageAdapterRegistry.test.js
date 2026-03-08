import {
  getAdapter,
  getSupportedLanguages,
} from '../../src/js/components/CodeEditor/languages/registry.js';

describe('Language Registry', () => {
  describe('getSupportedLanguages', () => {
    it('should return all supported languages', () => {
      const languages = getSupportedLanguages();
      expect(languages.length).toBe(3);
    });

    it('should return languages with id and displayName', () => {
      const languages = getSupportedLanguages();
      languages.forEach(({ id, displayName }) => {
        expect(id).toBeDefined();
        expect(displayName).toBeDefined();
      });
    });

    it('should include python, javascript and cpp', () => {
      const languages = getSupportedLanguages();
      const ids = languages.map((l) => l.id);
      expect(ids).toContain('python');
      expect(ids).toContain('javascript');
      expect(ids).toContain('cpp');
    });
  });

  describe('getAdapter', () => {
    it('should return python adapter with correct shape', () => {
      const adapter = getAdapter('python');
      expect(adapter).toBeDefined();
      expect(adapter.id).toBe('python');
      expect(adapter.displayName).toBeDefined();
      expect(typeof adapter.highlight).toBe('function');
      expect(typeof adapter.checkSyntax).toBe('function');
    });

    it('should return javascript adapter with correct shape', () => {
      const adapter = getAdapter('javascript');
      expect(adapter).toBeDefined();
      expect(adapter.id).toBe('javascript');
      expect(adapter.displayName).toBeDefined();
      expect(typeof adapter.highlight).toBe('function');
      expect(typeof adapter.checkSyntax).toBe('function');
    });

    it('should return cpp adapter with correct shape', () => {
      const adapter = getAdapter('cpp');
      expect(adapter).toBeDefined();
      expect(adapter.id).toBe('cpp');
      expect(adapter.displayName).toBeDefined();
      expect(typeof adapter.highlight).toBe('function');
      expect(typeof adapter.checkSyntax).toBe('function');
    });

    it('should return undefined for unknown language', () => {
      const adapter = getAdapter('unknown');
      expect(adapter).toBeUndefined();
    });

    it('should return undefined for empty string', () => {
      const adapter = getAdapter('');
      expect(adapter).toBeUndefined();
    });

    it('should return undefined for null', () => {
      const adapter = getAdapter(null);
      expect(adapter).toBeUndefined();
    });
  });
});
