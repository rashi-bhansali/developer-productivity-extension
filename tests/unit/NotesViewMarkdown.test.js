import { NotesView } from '../../src/js/components/NotesView.js';

describe('NotesView - Markdown', () => {
  let notesView;
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'container';
    document.body.appendChild(container);
    notesView = new NotesView(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    jest.restoreAllMocks();
  });

  // --- Markdown toggle rendering ---

  describe('toggling markdown on', () => {
    it('should hide textarea and show rendered content when toggled on', async () => {
      const note = {
        cells: [
          {
            content: '# Hello',
            cellType: 'markdown',
            timestamp: '123',
            languageId: null,
          },
        ],
      };
      await notesView.render(note);

      const markdownBtn = document.querySelector('.markdown-btn');
      markdownBtn.dispatchEvent(new Event('click', { bubbles: true }));

      await new Promise((resolve) => setTimeout(resolve, 0));

      const textarea = document.querySelector('textarea');
      const renderedContent = document.querySelector('.rendered-content');

      expect(textarea.style.display).toBe('none');
      expect(renderedContent.style.display).toBe('block');
    });

    it('should render parsed markdown content when toggled on', async () => {
      const note = {
        cells: [
          {
            content: '# Hello',
            cellType: 'markdown',
            timestamp: '123',
            languageId: null,
          },
        ],
      };
      await notesView.render(note);

      const markdownBtn = document.querySelector('.markdown-btn');
      markdownBtn.dispatchEvent(new Event('click', { bubbles: true }));

      await new Promise((resolve) => setTimeout(resolve, 0));

      const renderedContent = document.querySelector('.rendered-content');
      expect(renderedContent.innerHTML).toContain('<h1>');
    });

    it('should hide toolbar when toggled on', async () => {
      const note = {
        cells: [
          {
            content: '# Hello',
            cellType: 'markdown',
            timestamp: '123',
            languageId: null,
          },
        ],
      };
      await notesView.render(note);

      const markdownBtn = document.querySelector('.markdown-btn');
      markdownBtn.dispatchEvent(new Event('click', { bubbles: true }));

      await new Promise((resolve) => setTimeout(resolve, 0));

      const toolbar = document.querySelector('.markdown-toolbar');
      expect(toolbar.style.display).toBe('none');
    });
  });

  // --- Markdown toggle off ---

  describe('toggling markdown off', () => {
    it('should show textarea and hide rendered content when toggled off', async () => {
      const note = {
        cells: [
          {
            content: '# Hello',
            cellType: 'markdownFormat',
            timestamp: '123',
            languageId: null,
          },
        ],
      };
      await notesView.render(note);

      const markdownBtn = document.querySelector('.markdown-btn');
      markdownBtn.dispatchEvent(new Event('click', { bubbles: true }));

      await new Promise((resolve) => setTimeout(resolve, 0));

      const textarea = document.querySelector('textarea');
      const renderedContent = document.querySelector('.rendered-content');

      expect(textarea.style.display).toBe('block');
      expect(renderedContent.style.display).toBe('none');
    });

    it('should show toolbar when toggled off', async () => {
      const note = {
        cells: [
          {
            content: '# Hello',
            cellType: 'markdownFormat',
            timestamp: '123',
            languageId: null,
          },
        ],
      };
      await notesView.render(note);

      const markdownBtn = document.querySelector('.markdown-btn');
      markdownBtn.dispatchEvent(new Event('click', { bubbles: true }));

      await new Promise((resolve) => setTimeout(resolve, 0));

      const toolbar = document.querySelector('.markdown-toolbar');
      expect(toolbar.style.display).toBe('flex');
    });
  });

  // --- Toolbar state ---

  describe('toolbar state', () => {
    it('should disable toolbar buttons in markdownFormat mode', async () => {
      const note = {
        cells: [
          {
            content: '# Hello',
            cellType: 'markdownFormat',
            timestamp: '123',
            languageId: null,
          },
        ],
      };
      await notesView.render(note);

      const toolbarButtons = document.querySelectorAll(
        '.markdown-toolbar-button',
      );
      toolbarButtons.forEach((button) => {
        expect(button.disabled).toBe(true);
      });
    });

    it('should enable toolbar buttons in markdown mode', async () => {
      const note = {
        cells: [
          {
            content: '# Hello',
            cellType: 'markdown',
            timestamp: '123',
            languageId: null,
          },
        ],
      };
      await notesView.render(note);

      const toolbarButtons = document.querySelectorAll(
        '.markdown-toolbar-button',
      );
      toolbarButtons.forEach((button) => {
        expect(button.disabled).toBe(false);
      });
    });
  });

  // --- onUpdateCell cellType on toggle ---

  describe('onUpdateCell called with correct cellType on toggle', () => {
    it('should call onUpdateCell with markdownFormat when toggled on', async () => {
      const mockUpdateCell = jest.fn();
      notesView.setOnUpdateCell(mockUpdateCell);

      const note = {
        cells: [
          {
            content: '# Hello',
            cellType: 'markdown',
            timestamp: '123',
            languageId: null,
          },
        ],
      };
      await notesView.render(note);

      const markdownBtn = document.querySelector('.markdown-btn');
      markdownBtn.dispatchEvent(new Event('click', { bubbles: true }));

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockUpdateCell).toHaveBeenCalledWith(
        '123',
        '# Hello',
        'markdownFormat',
        null, //languageId null for markdown cells
      );
    });

    it('should call onUpdateCell with markdown when toggled off', async () => {
      const mockUpdateCell = jest.fn();
      notesView.setOnUpdateCell(mockUpdateCell);

      const note = {
        cells: [
          {
            content: '# Hello',
            cellType: 'markdownFormat',
            timestamp: '123',
            languageId: null,
          },
        ],
      };
      await notesView.render(note);

      const markdownBtn = document.querySelector('.markdown-btn');
      markdownBtn.dispatchEvent(new Event('click', { bubbles: true }));

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockUpdateCell).toHaveBeenCalledWith(
        '123',
        '# Hello',
        'markdown',
        null,
      );
    });

    it('should call onUpdateCell with null languageId for markdown cells', async () => {
      const mockUpdateCell = jest.fn();
      notesView.setOnUpdateCell(mockUpdateCell);

      const note = {
        cells: [
          {
            content: '# Hello',
            cellType: 'markdown',
            timestamp: '123',
            languageId: null,
          },
        ],
      };
      await notesView.render(note);

      const markdownBtn = document.querySelector('.markdown-btn');
      markdownBtn.dispatchEvent(new Event('click', { bubbles: true }));

      await new Promise((resolve) => setTimeout(resolve, 0));

      const call = mockUpdateCell.mock.calls[0];
      expect(call[3]).toBeNull(); // languageId passed as null for markdown
    });
  });
});
