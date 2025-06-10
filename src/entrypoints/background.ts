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

  // Listen for messages from popup/content scripts/iframe
  browser.runtime.onMessage.addListener((message: { type: string; action: any; layout?: string; power?: boolean; }, sender: any, sendResponse: (arg0: {
    layout: any;
    power: boolean
  }) => void) => {
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

      // Notify all content scripts about state change
      notifyContentScripts();
    } else if (message.type === 'LAYOUT_CHANGED') {
      // Handle layout change from iframe
      const { setLayout } = require('@/entrypoints/store/layoutSlice');
      store.dispatch(setLayout(message.layout));
      sendResponse({ success: true });

      // Notify content scripts
      notifyContentScripts();
    } else if (message.type === 'POWER_TOGGLED') {
      // Handle power toggle from iframe
      const { setPower } = require('@/entrypoints/store/powerSlice');
      store.dispatch(setPower(message.power));
      sendResponse({ success: true });

      // Notify content scripts
      notifyContentScripts();
    } else if (message.type === 'GET_IFRAME_STATE') {
      // Content script requesting current state
      const state = store.getState();
      sendResponse({
        layout: state.layout?.mode || 'compact',
        power: state.power?.mode !== false
      });
    }

    return true;
  });

  // Listen for store changes and notify content scripts
  async function notifyContentScripts() {
    if (!store) return;

    const state = store.getState();
    const iframeState = {
      layout: state.layout?.mode || 'compact',
      power: state.power?.mode !== false
    };

    try {
      // Get all tabs and send message to content scripts
      const tabs = await browser.tabs.query({});

      for (const tab of tabs) {
        if (tab.id) {
          try {
            await browser.tabs.sendMessage(tab.id, {
              type: 'IFRAME_STATE_UPDATE',
              ...iframeState
            });
          } catch (error) {
            // Tab might not have content script, ignore error
          }
        }
      }
    } catch (error) {
      console.error('Failed to notify content scripts:', error);
    }
  }
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