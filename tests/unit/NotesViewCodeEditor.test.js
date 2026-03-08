import { NotesView } from '../../src/js/components/NotesView.js';

describe('NotesView Code Editor', () => {
  let notesView;
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'container';
    document.body.appendChild(container);
    notesView = new NotesView(container);

    // Always set a default mock to prevent crashes
    notesView.setOnUpdateCell(jest.fn());
    notesView.setOnAddCell(jest.fn());
    notesView.setOnDeleteCell(jest.fn());

    // Mock window.confirm to auto-confirm by default
    jest.spyOn(window, 'confirm').mockReturnValue(true);
  });

  afterEach(() => {
    document.body.removeChild(container);
    jest.restoreAllMocks();
  });

  // --- Language selector rendering ---

  describe('language selector rendering', () => {
    it('should render language selector for code cells', async () => {
      const note = {
        cells: [
          {
            content: '',
            cellType: 'code',
            timestamp: '123',
            languageId: 'python',
          },
        ],
      };
      await notesView.render(note);
      const select = document.querySelector('.code-cell-language-select');
      expect(select).not.toBeNull();
    });

    it('should not render language selector for markdown cells', async () => {
      const note = {
        cells: [
          {
            content: '',
            cellType: 'markdown',
            timestamp: '123',
            languageId: null,
          },
        ],
      };
      await notesView.render(note);
      const select = document.querySelector('.code-cell-language-select');
      expect(select).toBeNull();
    });

    it('should restore saved language on render', async () => {
      const note = {
        cells: [
          {
            content: 'const x = 10;',
            cellType: 'code',
            timestamp: '123',
            languageId: 'javascript',
          },
        ],
      };
      await notesView.render(note);
      const select = document.querySelector('.code-cell-language-select');
      expect(select.value).toBe('javascript');
    });

    it('should default to python if no languageId saved', async () => {
      const note = {
        cells: [
          { content: '', cellType: 'code', timestamp: '123', languageId: null },
        ],
      };
      await notesView.render(note);
      const select = document.querySelector('.code-cell-language-select');
      expect(select.value).toBe('python');
    });

    it('should show all supported languages in dropdown', async () => {
      const note = {
        cells: [
          {
            content: '',
            cellType: 'code',
            timestamp: '123',
            languageId: 'python',
          },
        ],
      };
      await notesView.render(note);
      const options = document.querySelectorAll(
        '.code-cell-language-select option',
      );
      const values = Array.from(options).map((o) => o.value);
      expect(values).toContain('python');
      expect(values).toContain('javascript');
      expect(values).toContain('cpp');
    });
  });

  // --- Language switch confirm ---

  describe('language switch with existing code - user confirms', () => {
    it('should clear cell content when user confirms language change', async () => {
      jest.spyOn(window, 'confirm').mockReturnValue(true);
      const note = {
        cells: [
          {
            content: 'print("hello")',
            cellType: 'code',
            timestamp: '123',
            languageId: 'python',
          },
        ],
      };
      await notesView.render(note);

      const select = document.querySelector('.code-cell-language-select');
      const codeTextarea = document.querySelector('.code-editor');

      // Verify content exists before switch
      expect(codeTextarea.value).toBe('print("hello")');

      // Switch language
      select.value = 'javascript';
      select.dispatchEvent(new Event('change'));

      // Content should be cleared
      expect(codeTextarea.value).toBe('');
    });

    it('should update dataset.currentLanguage after confirmed switch', async () => {
      jest.spyOn(window, 'confirm').mockReturnValue(true);
      const note = {
        cells: [
          {
            content: 'print("hello")',
            cellType: 'code',
            timestamp: '123',
            languageId: 'python',
          },
        ],
      };
      await notesView.render(note);

      const select = document.querySelector('.code-cell-language-select');
      select.value = 'javascript';
      select.dispatchEvent(new Event('change'));

      expect(select.dataset.currentLanguage).toBe('javascript');
    });

    it('should persist language change via onUpdateCell', async () => {
      jest.spyOn(window, 'confirm').mockReturnValue(true);
      const mockUpdateCell = jest.fn();
      notesView.setOnUpdateCell(mockUpdateCell);

      const note = {
        cells: [
          {
            content: 'print("hello")',
            cellType: 'code',
            timestamp: '123',
            languageId: 'python',
          },
        ],
      };
      await notesView.render(note);

      const select = document.querySelector('.code-cell-language-select');
      select.value = 'javascript';
      select.dispatchEvent(new Event('change'));

      expect(mockUpdateCell).toHaveBeenCalledWith(
        '123',
        '',
        'code',
        'javascript',
      );
    });
  });

  // --- Language switch cancel ---

  describe('language switch with existing code - user cancels', () => {
    it('should NOT clear cell content when user cancels', async () => {
      jest.spyOn(window, 'confirm').mockReturnValue(false);
      const note = {
        cells: [
          {
            content: 'print("hello")',
            cellType: 'code',
            timestamp: '123',
            languageId: 'python',
          },
        ],
      };
      await notesView.render(note);

      const select = document.querySelector('.code-cell-language-select');
      const codeTextarea = document.querySelector('.code-editor');

      select.value = 'javascript';
      select.dispatchEvent(new Event('change'));

      // Content should remain
      expect(codeTextarea.value).toBe('print("hello")');
    });

    it('should revert dropdown to previous language when user cancels', async () => {
      jest.spyOn(window, 'confirm').mockReturnValue(false);
      const note = {
        cells: [
          {
            content: 'print("hello")',
            cellType: 'code',
            timestamp: '123',
            languageId: 'python',
          },
        ],
      };
      await notesView.render(note);

      const select = document.querySelector('.code-cell-language-select');
      select.value = 'javascript';
      select.dispatchEvent(new Event('change'));

      // Dropdown should revert to python
      expect(select.value).toBe('python');
    });

    it('should NOT call onUpdateCell when user cancels', async () => {
      jest.spyOn(window, 'confirm').mockReturnValue(false);
      const mockUpdateCell = jest.fn();
      notesView.setOnUpdateCell(mockUpdateCell);

      const note = {
        cells: [
          {
            content: 'print("hello")',
            cellType: 'code',
            timestamp: '123',
            languageId: 'python',
          },
        ],
      };
      await notesView.render(note);

      const select = document.querySelector('.code-cell-language-select');
      select.value = 'javascript';
      select.dispatchEvent(new Event('change'));

      expect(mockUpdateCell).not.toHaveBeenCalled();
    });

    it('should NOT show confirm dialog when cell is empty', async () => {
      const mockConfirm = jest.spyOn(window, 'confirm');
      const note = {
        cells: [
          {
            content: '',
            cellType: 'code',
            timestamp: '123',
            languageId: 'python',
          },
        ],
      };
      await notesView.render(note);

      const select = document.querySelector('.code-cell-language-select');
      select.value = 'javascript';
      select.dispatchEvent(new Event('change'));

      expect(mockConfirm).not.toHaveBeenCalled();
    });
  });

  // --- Code persistence ---

  describe('code and language persistence', () => {
    it('should persist code content with languageId on input', async () => {
      jest.useFakeTimers();
      const mockUpdateCell = jest.fn();
      notesView.setOnUpdateCell(mockUpdateCell);

      const note = {
        cells: [
          {
            content: '',
            cellType: 'code',
            timestamp: '123',
            languageId: 'javascript',
          },
        ],
      };
      await notesView.render(note);

      const codeTextarea = document.querySelector('.code-editor');
      codeTextarea.value = 'const x = 10;';
      codeTextarea.dispatchEvent(new Event('input'));

      jest.advanceTimersByTime(200);

      expect(mockUpdateCell).toHaveBeenCalledWith(
        '123',
        'const x = 10;',
        'code',
        'javascript',
      );
      jest.useRealTimers();
    });

    it('should pass null languageId for markdown cells on input', async () => {
      jest.useFakeTimers();
      const mockUpdateCell = jest.fn();
      notesView.setOnUpdateCell(mockUpdateCell);

      const note = {
        cells: [
          {
            content: '',
            cellType: 'markdown',
            timestamp: '123',
            languageId: null,
          },
        ],
      };
      await notesView.render(note);

      const textarea = document.querySelector('textarea');
      textarea.value = 'hello world';
      textarea.dispatchEvent(new Event('input'));

      jest.advanceTimersByTime(500);

      expect(mockUpdateCell).toHaveBeenCalledWith(
        '123',
        'hello world',
        'markdown',
        null,
      );
      jest.useRealTimers();
    });
  });
});
