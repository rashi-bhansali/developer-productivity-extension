const PANEL_PATH = 'src/entry.html';

const enablePanelForTab = (tabId) =>
  chrome.sidePanel
    .setOptions({
      tabId,
      path: PANEL_PATH,
      enabled: true,
    })
    .catch((error) => console.error('Failed to enable side panel', error));

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

chrome.runtime.onStartup.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

chrome.tabs.onActivated.addListener(({ tabId }) => {
  void enablePanelForTab(tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!tab.url) {
    return;
  }

  if (!changeInfo.url && changeInfo.status !== 'complete') {
    return;
  }

  void enablePanelForTab(tabId);
});

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message?.type !== 'OPEN_SIDE_PANEL' || !sender.tab?.windowId) {
    return;
  }

  chrome.sidePanel
    .open({ windowId: sender.tab.windowId })
    .catch((error) => console.error('Failed to open side panel', error));
});
