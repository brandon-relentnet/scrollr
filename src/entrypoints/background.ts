import { configureStore, type EnhancedStore } from '@reduxjs/toolkit';
import { storage } from '#imports';
import rootReducer from '@/entrypoints/store/rootReducer.js';
// @ts-ignore
import { browser } from 'wxt/browser';

type RootState = ReturnType<typeof rootReducer>;
type AppStore = EnhancedStore<RootState>;

let store: AppStore | undefined;

export default defineBackground(() => {
  console.log('Hello background!', { id: browser.runtime.id });

  void initializeStore();

  browser.runtime.onMessage.addListener((message: { type: string; action: any; layout?: string; power?: boolean; }, sender: any, sendResponse: (arg0: {
    layout: any;
    power: boolean;
    error?: string;
    state?: any;
    success?: boolean;
  }) => void) => {
    if (!store) {
      sendResponse({ layout: 'error', power: false, error: 'Store not ready' });
      return true;
    }

    if (message.type === 'GET_STATE') {
      sendResponse({ layout: 'state', power: true, state: store.getState() });
    } else if (message.type === 'DISPATCH_ACTION') {
      store.dispatch(message.action);
      sendResponse({ layout: 'state', power: true, state: store.getState() });
      notifyContentScripts();
    } else if (message.type === 'LAYOUT_CHANGED') {
      const { setLayout } = require('@/entrypoints/store/layoutSlice');
      store.dispatch(setLayout(message.layout));
      sendResponse({ layout: 'success', power: true, success: true });
      notifyContentScripts();
    } else if (message.type === 'POWER_TOGGLED') {
      const { setPower } = require('@/entrypoints/store/powerSlice');
      store.dispatch(setPower(message.power));
      sendResponse({ layout: 'success', power: true, success: true });
      notifyContentScripts();
    } else if (message.type === 'GET_IFRAME_STATE') {
      const state = store.getState();
      sendResponse({
        layout: state.layout?.mode || 'compact',
        power: state.power?.mode !== false
      });
    }

    return true;
  });

  async function notifyContentScripts() {
    if (!store) return;

    const state = store.getState();
    const iframeState = {
      layout: state.layout?.mode || 'compact',
      power: state.power?.mode !== false
    };

    try {
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
    const savedState = await storage.getItem('local:appState');
    const preloadedState = savedState || undefined;

    store = configureStore({
      reducer: rootReducer,
      preloadedState
    });

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
    store = configureStore({ reducer: rootReducer });
  }
}