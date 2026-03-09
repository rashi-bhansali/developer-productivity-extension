export class DarkModeComponent {
  constructor() {
    this.body = document.body;
    this.darkModeBtn = null;
    this.themeStorageKey = 'devinks-theme';
  }

  /**
   * Applies saved preference; if none exists, follows system theme.
   */
  initializeSystemTheme() {
    const savedTheme = localStorage.getItem(this.themeStorageKey);

    if (savedTheme === 'dark' || savedTheme === 'light') {
      this.body.classList.toggle('dark-mode', savedTheme === 'dark');
      return;
    }

    const systemPrefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)',
    ).matches;
    this.body.classList.toggle('dark-mode', systemPrefersDark);
  }

  /**
   * Adds a manual toggle button for dark mode.
   * Ensures the button is created only once.
   */
  initializeManualThemeToggle(container) {
    if (this.darkModeBtn) {
      console.warn('Dark mode toggle button is already initialized.');
      return;
    }

    if (!container) {
      console.error('Container not found. Cannot initialize dark mode toggle.');
      return;
    }

    // Create the dark mode toggle button
    this.darkModeBtn = document.createElement('button');
    this.darkModeBtn.id = 'dark-mode-toggle'; // Use the ID for styling
    container.appendChild(this.darkModeBtn);

    // Set the initial button icon based on the current theme
    const setButtonIcon = () => {
      const isDarkMode = this.body.classList.contains('dark-mode');
      this.darkModeBtn.classList.toggle('is-dark', isDarkMode);
      this.darkModeBtn.innerHTML = `
        <span class="toggle-icon toggle-icon-sun"><i class="fa-solid fa-sun"></i></span>
        <span class="toggle-icon toggle-icon-moon"><i class="fa-solid fa-moon"></i></span>
        <span class="toggle-thumb" aria-hidden="true"></span>
      `;
      this.darkModeBtn.setAttribute(
        'aria-label',
        isDarkMode ? 'Switch to light mode' : 'Switch to dark mode',
      );
    };

    // Initial icon setup
    setButtonIcon();

    // Add click event listener for manual theme toggle
    this.darkModeBtn.addEventListener('click', () => {
      const isDark = this.body.classList.toggle('dark-mode');
      localStorage.setItem(this.themeStorageKey, isDark ? 'dark' : 'light');
      setButtonIcon();
      console.log(`Manual theme change: ${isDark ? 'dark' : 'light'}`);
    });
  }
}
