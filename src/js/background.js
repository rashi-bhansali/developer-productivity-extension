chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

chrome.runtime.onStartup.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message?.type !== 'OPEN_SIDE_PANEL' || !sender.tab?.id) {
    return;
  }

  chrome.sidePanel
    .open({ tabId: sender.tab.id })
    .catch((error) => console.error('Failed to open side panel', error));
});
