import React from 'react';
import ReactDOM from 'react-dom';
import Overlay from './components/Overlay';

function isSpecialPage(url) {
  return url.startsWith('chrome://') || url.startsWith('chrome-extension://');
}

function toggleOverlay(isActive, activeOverlayTab) {
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
  overlay.style.height = 'auto';
  overlay.style.zIndex = '9999';

  ReactDOM.render(<Overlay initialTab={activeOverlayTab} />, overlay);
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === "updateOverlay") {
    toggleOverlay(request.isActive, request.activeOverlayTab);
    sendResponse({ status: "Overlay updated" });
  }
});

// Check initial state and initialize overlay if not on a special page
if (!isSpecialPage(window.location.href)) {
  chrome.storage.local.get(["isActive", "activeOverlayTab"], (result) => {
    if (chrome.runtime.lastError) {
      console.error("Error retrieving storage data:", chrome.runtime.lastError);
      return;
    }
    toggleOverlay(result.isActive, result.activeOverlayTab);
  });
}
