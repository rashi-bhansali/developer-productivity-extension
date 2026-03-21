const PANEL_PATH = 'src/entry.html';

const enablePanelForTab = (tabId) =>
  chrome.sidePanel
    .setOptions({
      tabId,
      path: PANEL_PATH,
      enabled: true,
    })
    .catch((error) => console.error('Failed to enable side panel', error));

const disableGlobalPanel = () =>
  chrome.sidePanel
    .setOptions({
      path: PANEL_PATH,
      enabled: false,
    })
    .catch((error) =>
      console.error('Failed to disable global side panel', error),
    );

const configureExistingTabs = () =>
  chrome.tabs
    .query({})
    .then((tabs) =>
      Promise.all(
        tabs
          .filter((tab) => tab.id && /^https?:/.test(tab.url || ''))
          .map((tab) => enablePanelForTab(tab.id)),
      ),
    )
    .catch((error) =>
      console.error('Failed to configure existing tabs', error),
    );

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  void disableGlobalPanel();
  void configureExistingTabs();
});

chrome.runtime.onStartup.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  void disableGlobalPanel();
  void configureExistingTabs();
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
  if (message?.type !== 'OPEN_SIDE_PANEL' || !sender.tab?.id) {
    return;
  }

  chrome.sidePanel
    .open({ tabId: sender.tab.id })
    .catch((error) => console.error('Failed to open side panel', error));
});
