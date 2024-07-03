let isActive = false;

// Retrieve the initial state from chrome.storage when the background script loads
chrome.storage.local.get(['isActive'], function(result) {
  if (result.isActive !== undefined) {
    isActive = result.isActive;
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === "toggleOverlay") {
    isActive = !isActive;
    chrome.storage.local.set({ isActive: isActive }); // Store the new state
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {message: "toggleOverlay", isActive: isActive}, (response) => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message);
        } else {
          console.log('Response from content script:', response.status);
        }
      });
    });
  }
  sendResponse({status: "done"});
});
