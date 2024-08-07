function isSpecialPage(url) {
  return url.startsWith('chrome://') || url.startsWith('chrome-extension://');
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ isActive: false, activeTab: 'Baseball' });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === "toggleOverlay") {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const activeTab = tabs[0];
      if (!activeTab || isSpecialPage(activeTab.url)) {
        chrome.storage.local.set({ isActive: false }, () => {
          sendResponse({ status: "Special page detected, overlay turned off" });
        });
      } else {
        chrome.storage.local.set({ isActive: request.isActive }, () => {
          chrome.tabs.query({}, (tabs) => {
            tabs.forEach((tab) => {
              if (!isSpecialPage(tab.url)) {
                chrome.tabs.sendMessage(tab.id, { message: "updateOverlay", isActive: request.isActive, activeTab: request.activeTab }, (response) => {
                  if (chrome.runtime.lastError) {
                    console.warn(`Could not send message to tab ${tab.id}: ${chrome.runtime.lastError.message}`);
                  }
                });
              }
            });
          });
          sendResponse({ status: "Overlay toggled" });
        });
      }
    });
    return true;
  }
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.storage.local.get(["isActive", "activeTab"], (result) => {
    chrome.tabs.get(activeInfo.tabId, (activeTab) => {
      if (!activeTab || isSpecialPage(activeTab.url)) {
        return;
      }
      chrome.tabs.sendMessage(activeTab.id, { message: "updateOverlay", isActive: result.isActive, activeTab: result.activeTab }, (response) => {
        if (chrome.runtime.lastError) {
          console.warn(`Could not send message to tab ${activeTab.id}: ${chrome.runtime.lastError.message}`);
        }
      });
    });
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && !isSpecialPage(tab.url)) {
    chrome.storage.local.get(["isActive", "activeTab"], (result) => {
      chrome.tabs.sendMessage(tabId, { message: "updateOverlay", isActive: result.isActive, activeTab: result.activeTab }, (response) => {
        if (chrome.runtime.lastError) {
          console.warn(`Could not send message to tab ${tabId}: ${chrome.runtime.lastError.message}`);
        }
      });
    });
  }
});
