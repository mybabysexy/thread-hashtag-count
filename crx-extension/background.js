// Background script to handle sidebar functionality

// Listen for the extension icon click
chrome.action.onClicked.addListener((tab) => {
  // Open the side panel
  chrome.sidePanel.open({ tabId: tab.id });
});
