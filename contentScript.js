console.log('Content script loaded');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received in content script:', request);
  if (request.message === "toggleOverlay") {
    toggleOverlay(request.isActive);
  }
  sendResponse({status: "done"});
});

function toggleOverlay(isActive) {
  console.log('Toggling overlay:', isActive);
  if (isActive) {
    if (!document.getElementById('scrollr-overlay')) {
      console.log('Creating overlay');
      const overlay = document.createElement('div');
      overlay.id = 'scrollr-overlay';
      overlay.style.position = 'fixed';
      overlay.style.bottom = '0';
      overlay.style.left = '0';
      overlay.style.width = '100%';
      overlay.style.height = '250px';
      overlay.style.backgroundColor = '#1e1e2f';
      overlay.style.color = 'white';
      overlay.style.textAlign = 'center';
      overlay.style.lineHeight = '250px';
      overlay.style.zIndex = '10000';
      overlay.textContent = 'Scrollr is ON';
      document.body.appendChild(overlay);
    } else {
      console.log('Overlay already exists');
    }
  } else {
    const overlay = document.getElementById('scrollr-overlay');
    if (overlay) {
      console.log('Removing overlay');
      overlay.remove();
    } else {
      console.log('No overlay to remove');
    }
  }
}
