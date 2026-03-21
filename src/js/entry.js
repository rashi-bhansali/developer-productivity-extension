import { NoteRepository } from './repositories/NoteRepository.js';
import { NotesView } from './components/NotesView.js';
import { DarkModeComponent } from './components/DarkModeComponent.js';

// This is the main app/entry point
class NotesApp {
  constructor() {
    // This is the where the notes are stored (communication with backend)
    this.noteRepository = new NoteRepository();
    // This is the where the notes are displayed
    this.notesView = new NotesView(document.getElementById('container'));
    // This is the service for managing dark mode
    this.darkModeComponent = new DarkModeComponent();
    this.activeTabId = null;
    this.activeUrl = null;

    this.initialize();
  }

  async initialize() {
    this.setupEventListeners();
    this.setupTabListeners();
    await this.syncWithActiveTab(true);
    this.darkModeComponent.initializeSystemTheme(); // Sync with system theme
    this.darkModeComponent.initializeManualThemeToggle(
      document.getElementById('theme-toggle-container'), // Attach to sticky header so toggle stays sticky
    );
  }

  async loadNotes() {
    try {
      const url = this.activeUrl || (await this.getUrl());
      const note =
        (await this.noteRepository.getNoteByUrl(url)) ||
        (await this.noteRepository.addNote(url));
      console.log('Inside load notes: ', note);
      await this.notesView.render(note);
    } catch (error) {
      console.error('Error in loading notes', error);
    }
  }

  setupTabListeners() {
    chrome.tabs.onActivated.addListener(async () => {
      this.notesView.prepareForTabChange();
      await this.syncWithActiveTab();
    });

    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
      if (!tab.active) return;
      if (!changeInfo.url && changeInfo.status !== 'complete') return;
      if (this.activeTabId !== null && tabId !== this.activeTabId) return;

      this.notesView.prepareForTabChange();
      await this.syncWithActiveTab(true);
    });
  }

  async syncWithActiveTab(forceReload = false) {
    try {
      const tab = await this.getActiveTab();
      if (!tab?.url) {
        this.activeTabId = tab?.id || null;
        this.activeUrl = null;
        return;
      }

      const normalizedUrl = this.noteRepository.removeAllQueryParams(tab.url);
      const shouldReload =
        forceReload ||
        this.activeTabId !== tab.id ||
        this.activeUrl !== normalizedUrl;

      if (!shouldReload) {
        return;
      }

      this.activeTabId = tab.id;
      this.activeUrl = normalizedUrl;
      await this.loadNotes();
    } catch (error) {
      console.error('Error while syncing side panel with active tab', error);
    }
  }

  setupEventListeners() {
    this.notesView.setOnDeleteCell(
      async (url, timestamp) => await this.handleDeleteCell(url, timestamp),
    );
    this.notesView.setOnAddCell(
      async (url, timestamp, content, cellType, targetTimestamp) =>
        await this.handleAddCell(
          url,
          timestamp,
          content,
          cellType,
          targetTimestamp,
        ),
    );
    this.notesView.setOnUpdateCell(
      async (url, timestamp, content, cellType, languageId) =>
        await this.handleUpdateCell(
          url,
          timestamp,
          content,
          cellType,
          languageId,
        ),
    );
  }

  async handleAddCell(url, timestamp, content, cellType, targetTimestamp) {
    try {
      await this.noteRepository.addCellToNote(
        url,
        timestamp,
        content,
        cellType,
        targetTimestamp,
      );
    } catch (error) {
      console.error('Error in adding new cell to the note', error);
    }
  }

  async handleDeleteCell(url, timestamp) {
    try {
      await this.noteRepository.deleteCellFromNote(url, timestamp);
    } catch (error) {
      console.error('Error in deleting cell from the note', error);
    }
  }

  async handleUpdateCell(url, timestamp, content, cellType, languageId = null) {
    try {
      await this.noteRepository.updateCellContent(
        url,
        timestamp,
        content,
        cellType,
        languageId, // null for markdown, language id for code
      );
    } catch (error) {
      console.error('Error in saving cell content to the note', error);
    }
  }

  async getUrl() {
    const tab = await this.getActiveTab();
    return tab?.url;
  }

  async getActiveTab() {
    const [tab] = await chrome.tabs.query({
      active: true,
      lastFocusedWindow: true,
    });
    return tab;
  }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new NotesApp();
  document
    .getElementById('open-dashboard-btn')
    .addEventListener('click', () => {
      chrome.tabs.create({ url: chrome.runtime.getURL('src/dashboard.html') });
    });
});
