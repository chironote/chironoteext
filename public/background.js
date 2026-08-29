async function configureTabPanel(tabId) {
  if (!Number.isInteger(tabId) || tabId < 0) return;
  try {
    await chrome.sidePanel.setOptions({
      tabId,
      path: 'index.html',
      enabled: true
    });
  } catch {
    console.warn('side_panel_tab_setup_failed');
  }
}

// Prepare contextual panels without opening them. Chrome owns the toolbar click:
// awaiting setOptions inside onClicked can lose the gesture required by open().
chrome.tabs.onCreated.addListener((tab) => configureTabPanel(tab.id));
chrome.tabs.onReplaced.addListener((addedTabId) => configureTabPanel(addedTabId));

function configureExistingTabs() {
  // Reading tab IDs does not require the sensitive "tabs" permission.
  return chrome.tabs.query({}).then((tabs) => Promise.all(
    tabs.map((tab) => configureTabPanel(tab.id))
  )).catch(() => {
    console.warn('side_panel_tabs_setup_failed');
  });
}

chrome.runtime.onStartup.addListener(configureExistingTabs);
// Also prepare already-open tabs when installed/reloaded or the worker restarts.
configureExistingTabs();

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {
  console.warn('side_panel_setup_failed');
});
