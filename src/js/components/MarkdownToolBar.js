export class MarkdownToolBar {
  constructor(cell, cellContainer, onUpdateCell) {
    this.cellContainer = cellContainer;
    this.textArea = cellContainer.querySelector('textarea');
    this.onUpdateCell = onUpdateCell;
    this.toolbar = document.createElement('div');
    this.toolbar.classList.add('markdown-toolbar'); // Style using CSS
    this.cell = cell;

    // Predefined button configurations
    this.buttons = [
      {
        id: 'heading-dropdown',
        tooltip: 'Headings',
        dropdown: [
          { prefix: '# ', suffix: '', label: 'H1' },
          { prefix: '## ', suffix: '', label: 'H2' },
          { prefix: '### ', suffix: '', label: 'H3' },
          { prefix: '#### ', suffix: '', label: 'H4' },
          { prefix: '##### ', suffix: '', label: 'H5' },
          { prefix: '###### ', suffix: '', label: 'H6' },
        ],
        icon: 'heading',
      },
      {
        id: 'bold-btn',
        prefix: '**',
        suffix: '**',
        tooltip: 'Bold',
        icon: 'bold',
        shortcut: 'Ctrl+B / ⌘B',
      },
      {
        id: 'italic-btn',
        prefix: '*',
        suffix: '*',
        tooltip: 'Italics',
        icon: 'italic',
        shortcut: 'Ctrl+I / ⌘I',
      },
      {
        id: 'underline-btn',
        prefix: '<u>',
        suffix: '</u>',
        tooltip: 'Underline',
        icon: 'underline',
        shortcut: 'Ctrl+U / ⌘U',
      },
      {
        id: 'strikethrough-btn',
        prefix: '~~',
        suffix: '~~',
        tooltip: 'Strikethrough',
        icon: 'strikethrough',
        shortcut: 'Ctrl+Shift+S / ⌘Shift+S',
      },
      {
        id: 'unordered-list-btn',
        prefix: '- ',
        suffix: '',
        tooltip: 'List',
        icon: 'list',
        shortcut: 'Ctrl+L / ⌘L',
      },
      {
        id: 'code-btn',
        prefix: '```',
        suffix: '```',
        tooltip: 'Code Snippet',
        icon: 'code',
        shortcut: 'Ctrl+` / ⌘`',
      },
      {
        id: 'hr-btn',
        prefix: '',
        suffix: '\n---',
        tooltip: 'Horizontal Rule',
        icon: 'minus',
        shortcut: 'Ctrl+H / ⌘H',
      },
      {
        id: 'link-btn',
        prefix: '[',
        suffix: '](url)',
        tooltip: 'Link',
        icon: 'link',
        shortcut: 'Ctrl+K / ⌘K',
      },
    ];

    // Register shortcuts
    this.registerShortcuts();
  }

  render() {
    this.buttons.forEach((buttonConfig) => {
      if (buttonConfig.dropdown) {
        const dropdown = this.createDropdown(buttonConfig);
        this.toolbar.appendChild(dropdown);
      } else {
        const button = this.createButton(buttonConfig);
        this.toolbar.appendChild(button);
      }
    });

    return this.toolbar;
  }

  getIconSvg(icon) {
    const paths = {
      heading: '<path d="M6 12h12"/><path d="M6 20V4"/><path d="M18 20V4"/>',
      bold: '<path d="M6 4h7a4 4 0 0 1 0 8H6z"/><path d="M6 12h8a4 4 0 0 1 0 8H6z"/>',
      italic:
        '<line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/>',
      underline:
        '<path d="M6 4v6a6 6 0 0 0 12 0V4"/><line x1="4" y1="20" x2="20" y2="20"/>',
      strikethrough:
        '<path d="M16 4H9a3 3 0 0 0-2.83 4"/><path d="M14 12a4 4 0 0 1 0 8H6"/><line x1="4" y1="12" x2="20" y2="12"/>',
      list: '<line x1="8" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="20" y2="12"/><line x1="8" y1="18" x2="20" y2="18"/><line x1="4" y1="6" x2="4.01" y2="6"/><line x1="4" y1="12" x2="4.01" y2="12"/><line x1="4" y1="18" x2="4.01" y2="18"/>',
      code: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
      minus: '<line x1="5" y1="12" x2="19" y2="12"/>',
      link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    };

    return `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[icon] || ''}</svg>`;
  }

  createButton({ id, prefix, suffix, tooltip, icon }) {
    const button = document.createElement('button');
    button.type = 'button';
    button.id = id;
    button.title = tooltip;
    button.classList.add('markdown-toolbar-button');
    button.innerHTML = this.getIconSvg(icon);

    button.addEventListener('click', () => {
      this.insertMarkdown(prefix, suffix);
    });

    return button;
  }

  createDropdown({ id, tooltip, dropdown, icon }) {
    const container = document.createElement('div');
    container.id = id;
    container.classList.add('markdown-toolbar-dropdown');
    container.title = tooltip;

    const dropdownButton = document.createElement('button');
    dropdownButton.type = 'button';
    dropdownButton.classList.add('markdown-toolbar-button');
    dropdownButton.innerHTML = this.getIconSvg(icon);
    container.appendChild(dropdownButton);

    const dropdownMenu = document.createElement('div');
    dropdownMenu.classList.add('dropdown-menu');

    dropdown.forEach(({ prefix, suffix, label }) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.classList.add('dropdown-item');
      item.textContent = label;
      item.addEventListener('click', () => {
        this.insertMarkdown(prefix, suffix);
      });
      dropdownMenu.appendChild(item);
    });

    container.appendChild(dropdownMenu);
    return container;
  }

  insertMarkdown(prefix, suffix) {
    if (!this.textArea) {
      console.error('Textarea not found in the cell container.');
      return;
    }

    const scrollTop = this.textArea.scrollTop;
    const start = this.textArea.selectionStart;
    const end = this.textArea.selectionEnd;
    const text = this.textArea.value;

    const selectedText = text.slice(start, end);
    const newText =
      text.slice(0, start) + prefix + selectedText + suffix + text.slice(end);
    this.textArea.value = newText;

    const cursorPosition = start + prefix.length + selectedText.length;

    this.textArea.focus();
    this.textArea.setSelectionRange(cursorPosition, cursorPosition);
    this.textArea.scrollTop = scrollTop;

    if (this.onUpdateCell) {
      const timestamp = this.cell.timestamp;
      this.onUpdateCell(timestamp, this.textArea.value, 'markdown');
    }
  }

  registerShortcuts() {
    document.addEventListener('keydown', (event) => {
      const isShortcutKey = event.ctrlKey || event.metaKey;
      if (!isShortcutKey || !this.textArea) return;

      const key = event.key.toLowerCase();

      // Define a map of recognized shortcuts
      const shortcuts = {
        b: { prefix: '**', suffix: '**' },
        i: { prefix: '*', suffix: '*' },
        u: { prefix: '<u>', suffix: '</u>' },
        s: event.shiftKey ? { prefix: '~~', suffix: '~~' } : null,
        l: { prefix: '- ', suffix: '' },
        '`': { prefix: '```', suffix: '```' },
        h: { prefix: '', suffix: '\n---' },
        k: { prefix: '[', suffix: '](url)' },
      };

      const shortcut = shortcuts[key];

      // Only prevent default if the shortcut is recognized
      if (shortcut) {
        event.preventDefault();
        if (shortcut.prefix !== undefined && shortcut.suffix !== undefined) {
          this.insertMarkdown(shortcut.prefix, shortcut.suffix);
        }
      }
    });
  }
}
