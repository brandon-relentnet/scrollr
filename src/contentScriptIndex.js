import React from 'react';
import ReactDOM from 'react-dom';
import Overlay from './components/Overlay';

function isSpecialPage(url) {
  return url.startsWith('chrome://') || url.startsWith('chrome-extension://');
}

function toggleOverlay(isActive) {
  let overlay = document.getElementById('scrollr-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'scrollr-overlay';
    document.body.appendChild(overlay);
  }
  overlay.style.display = isActive ? 'block' : 'none';
  overlay.style.position = 'fixed';
  overlay.style.bottom = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '250px';
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  overlay.style.zIndex = '9999';

  if (isActive) {
    ReactDOM.render(<Overlay />, overlay);
  } else {
    ReactDOM.unmountComponentAtNode(overlay);
  }
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === "updateOverlay") {
    toggleOverlay(request.isActive);
    sendResponse({ status: "Overlay updated" });
  }
});

// Check initial state and initialize overlay if not on a special page
chrome.storage.local.get("isActive", (result) => {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    const activeTab = tabs[0];
    if (activeTab && !isSpecialPage(activeTab.url)) {
      toggleOverlay(result.isActive);
    }
  });
});
