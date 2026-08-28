chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((error) => {
  console.error('Unable to configure the ChiroNote side panel:', error);
});
