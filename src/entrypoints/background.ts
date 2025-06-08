import { configureStore, type EnhancedStore } from '@reduxjs/toolkit';
import rootReducer from '@/entrypoints/store/rootReducer.js';

// Get the RootState type from your root reducer
type RootState = ReturnType<typeof rootReducer>;
type AppStore = EnhancedStore<RootState>;

let store: AppStore | undefined;

export default defineBackground(() => {
  console.log('Hello background!', { id: browser.runtime.id });

  // Initialize the store by loading from chrome.storage
  chrome.storage.local.get(['appState'], (result) => {
    const preloadedState = result.appState || undefined;
    store = configureStore({ reducer: rootReducer, preloadedState });

    // Persist to chrome.storage on every store update
    store.subscribe(() => {
      const state = store!.getState();
      // Handle the Promise properly
      chrome.storage.local.set({ appState: state }).catch((error) => {
        console.error('Failed to save state to storage:', error);
      });
    });
  });

  // Listen for messages from popup/content scripts
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!store) {
      sendResponse({ error: 'Store not ready' });
      return true;
    }

    if (message.type === 'GET_STATE') {
      sendResponse({ state: store.getState() });
    } else if (message.type === 'DISPATCH_ACTION') {
      store.dispatch(message.action);
      // Respond with the updated state
      sendResponse({ state: store.getState() });
    }

    return true;
  });
});