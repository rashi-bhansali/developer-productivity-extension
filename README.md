# DevInks Chrome Extension

![DevInks](https://github.com/user-attachments/assets/7f31b63d-8ebf-4bd7-b350-a5b93b8df165)

DevInks is a Chrome extension that allows you to take rich text or markdown notes and code snippets directly on any webpage. The extension supports both dark mode and light mode, provides a user-friendly Markdown toolbar, enables code editing in Python, JS & C++, persists notes per-website, between sessions. It also includes a Notes Dashboard to view and manage all your notes across every site, from one place.

## Features

* **Text Notes with Markdown Support** :

  Create and edit notes with full Markdown support. A dedicated toolbar helps you quickly insert headings, bold text, italics, strikethrough, underline, code blocks, and more.
* **Markdown/Rendered Toggle** :

  Easily switch between text or raw markdown editing and rendered preview using the preview toggle button (eye-icon). When rendered, the Markdown toolbar is hidden for a distraction-free reading experience.

![Markdown](admin/pictures/markdown.gif "Markdown Rendering Demo")

* **Multi-Language Code Snippets with Syntax Highlighting** :

  Add code cells to your notes with support for  **Python** ,  **JavaScript** , and  **C++** . Select your language from the dropdown in each code cell. The editor highlights keywords, strings, comments, numbers, functions, operators, and built-ins for each language. Basic syntax checks surface common errors inline as you type.

  ![Code](admin/pictures/code.gif "Code Snippet Demo")
* **Language Persistence** :

  The selected language for each code cell is saved and restored across sessions. Switching languages prompts a confirmation to avoid accidentally clearing existing code.
* 
* **Notes Dashboard** :

  Never lose a note because you forgot which website it was on. Click the dashboard icon in the extension header to open a full-tab view of all your notes across every website - your personal notes inbox for the web. Each entry shows the URL, a preview of the first cell, cell count, and date. Jump back to the original page or delete a site's notes directly from the dashboard.

  <img src="admin/pictures/dashboard.png" alt="Code" width="600" height="400">

  **Dark Mode Compatibility** :
* The extension automatically respects system-level dark mode preferences. A toggle button also lets you manually switch between light and dark modes.

![Darkmode](admin/pictures/darkmode.gif "Theme Switch Demo")

* **Keyboard Shortcuts** :

  Speed up your workflow with keyboard shortcuts for common formatting actions (e.g., `Ctrl+B`/`⌘B` for bold, `Ctrl+I`/`⌘I` for italic, and so forth), without interfering with standard browser shortcuts like copy and paste.
* **Persistent Notes** :

  Notes are saved and persisted using IndexedDB. Even after you close the extension or restart your browser, your notes remain intact—including cell types, content, and selected languages.

## Installation

### From the Chrome Web Store

1. Go to the [DevInks Chrome Web Store page](https://chrome.google.com/webstore).
2. Click on  **"Add to Chrome"** .
3. Confirm the installation.

### Manual Installation

1. **Clone or Download the Repository** :

```bash
   git clone https://github.com/rashi-bhansali/developer-productivity-extension.git
```

1. **Load the Extension in Chrome** :

* Open `chrome://extensions` in your Chrome browser.
* Enable **Developer mode** (toggle in the top right corner).
* Click on **"Load unpacked"** and select the `devinks` folder from your local machine.

1. **Access the Extension** :

* The extension's icon will appear in your Chrome toolbar.
* Pin it for quick access if desired.

## Usage

1. **Open the Extension** :

   Click the extension's icon to open DevInks on the current webpage.
2. **Add and Edit Notes** :

* Click on **"+ Text"** or **"+ Code"** to create new cells.
* For Text cells: type in text or markdown, toggle between raw and rendered view using the eye icon.
* For Code cells: select your language (Python, JavaScript, or C++) from the dropdown, then enjoy syntax highlighting and inline syntax checks as you type.

3. **Notes Dashboard** :

* Click the dashboard icon (top-left of the extension header) to open a full-tab view of all notes across every website.
* Preview content, jump to the original page, or delete a site's notes from the dashboard.

4. **Markdown Toolbar** :

* Insert headings, bold, italic, underline, strike-through text, code blocks, horizontal rules, and links using the toolbar buttons.
* Hover over the toolbar buttons to see their tooltips, or use keyboard shortcuts for faster editing.

5. **Dark Mode Toggle** :

* A toggle button appears in the extension header.
* Click it to switch between light and dark themes.
* The extension also respects your system-level dark mode preference.

6. **Preservation of State** :

* Close the extension and reopen it later; your notes and their states remain as you left them.
* Markdown cells that were rendered will return in rendered form. Code cells restore both their content and the selected language.

## Keyboard Shortcuts (Examples)

* `Ctrl+B` / `⌘B`: Bold text
* `Ctrl+I` / `⌘I`: Italic text
* `Ctrl+U` / `⌘U`: Underline text
* `Ctrl+Shift+S` / `⌘Shift+S`: Strike-through text
* `Ctrl+L` / `⌘L`: Insert a list
* `Ctrl+H` / `⌘H`: Insert a horizontal rule
* `Ctrl+K` / `⌘K`: Insert a link

## Architecture

DevInks uses a modular adapter/registry pattern for language support. Each language (Python, JavaScript, C++) is an independent adapter exposing a consistent interface (`id`, `displayName`, `highlight`, `checkSyntax`). A central registry makes it straightforward to add new languages in the future.

## Contributing

1. Fork the repository and create a new branch for your feature or bug fix.
2. Commit changes with clear and descriptive commit messages.
3. Open a pull request for review.

## Privacy Policy

DevInks does not collect, store, or transmit any personal data or user information. All data, including notes created using this extension, is stored locally on the user's device using IndexedDB. No information is sent to external servers or shared with third parties.

---

With DevInks, you can effortlessly organize your thoughts, notes and code samples all accessible with a single click in Chrome!
