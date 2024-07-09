// background.js
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ isActive: false });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === "toggleOverlay") {
    chrome.storage.local.set({ isActive: request.isActive }, () => {
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          chrome.tabs.sendMessage(tab.id, { message: "updateOverlay", isActive: request.isActive });
        });
      });
    });
    sendResponse({ status: "Overlay toggled" });
  }
});

chrome.tabs.onActivated.addListener(() => {
  chrome.storage.local.get("isActive", (result) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(tab.id, { message: "updateOverlay", isActive: result.isActive });
      });
    });
  });
});
