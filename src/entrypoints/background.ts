import { configureStore, type EnhancedStore } from '@reduxjs/toolkit';
import { storage } from '#imports';
import rootReducer from '@/entrypoints/store/rootReducer.js';
// @ts-ignore
import { browser } from 'wxt/browser';

// Get the RootState type from your root reducer
type RootState = ReturnType<typeof rootReducer>;
type AppStore = EnhancedStore<RootState>;

let store: AppStore | undefined;

export default defineBackground(() => {
  console.log('Hello background!', { id: browser.runtime.id });

  // Initialize store asynchronously but don't make the main function async
  void initializeStore();

  // Listen for messages from popup/content scripts
  browser.runtime.onMessage.addListener((message: { type: string; action: any; }, sender: any, sendResponse: (arg0: { error?: string; state?: any; }) => void) => {
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

async function initializeStore() {
  try {
    // Initialize the store by loading from WXT storage
    const savedState = await storage.getItem('local:appState');

    // Only use savedState as preloadedState if it's not null/undefined
    // Redux expects undefined (not null) to use default state
    const preloadedState = savedState || undefined;

    store = configureStore({
      reducer: rootReducer,
      preloadedState
    });

    // Persist to WXT storage on every store update
    store.subscribe(async () => {
      try {
        const state = store!.getState();
        await storage.setItem('local:appState', state);
      } catch (error) {
        console.error('Failed to save state to storage:', error);
      }
    });

    console.log('Store initialized successfully');
  } catch (error) {
    console.error('Failed to initialize store:', error);
    // Create store with default state if loading fails
    store = configureStore({ reducer: rootReducer });
  }
}