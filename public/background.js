chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {
  console.warn('side_panel_setup_failed');
});
