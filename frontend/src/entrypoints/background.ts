import { configureStore, type EnhancedStore } from '@reduxjs/toolkit';
import { storage } from '#imports';
import rootReducer from '@/entrypoints/store/rootReducer.js';
// @ts-ignore
import { browser } from 'wxt/browser';
// Import actions statically for better performance
import { setLayout, setSpeed, setPosition, setOpacity } from '@/entrypoints/store/layoutSlice.js';
import { setPower } from '@/entrypoints/store/powerSlice.js';
import debugLogger, { DEBUG_CATEGORIES } from '@/entrypoints/utils/debugLogger.js';

type RootState = ReturnType<typeof rootReducer>;
type AppStore = EnhancedStore<RootState>;

let store: AppStore | undefined;

export default defineBackground(() => {
  debugLogger.info(DEBUG_CATEGORIES.STORAGE, 'Background script initialized', { id: browser.runtime.id });

  void initializeStore();

  browser.runtime.onMessage.addListener((message: { type: string; action: any; layout?: string; power?: boolean; speed?: string; position?: string; opacity?: number; }, sender: any, sendResponse: (arg0: {
    layout: any;
    power: boolean;
    speed?: string;
    position?: string;
    opacity?: number;
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
      store.dispatch(setLayout(message.layout));
      sendResponse({ layout: 'success', power: true, success: true });
      notifyContentScripts();
    } else if (message.type === 'POWER_TOGGLED') {
      store.dispatch(setPower(message.power));
      sendResponse({ layout: 'success', power: true, success: true });
      notifyContentScripts();
    } else if (message.type === 'SPEED_CHANGED') {
      store.dispatch(setSpeed(message.speed));
      sendResponse({ layout: 'success', power: true, success: true });
      notifyContentScripts();
    } else if (message.type === 'POSITION_CHANGED') {
      store.dispatch(setPosition(message.position));
      sendResponse({ layout: 'success', power: true, success: true });
      notifyContentScripts();
    } else if (message.type === 'OPACITY_CHANGED') {
      store.dispatch(setOpacity(message.opacity));
      sendResponse({ layout: 'success', power: true, success: true });
      notifyContentScripts();
    } else if (message.type === 'GET_IFRAME_STATE') {
      const state = store.getState();
      sendResponse({
        layout: state.layout?.mode || 'compact',
        speed: state.layout?.speed || 'classic',
        position: state.layout?.position || 'top',
        opacity: state.layout?.opacity ?? 1.0,
        power: state.power?.mode !== false
      });
    } else if (message.type === 'LOGOUT_REFRESH') {
      // Handle logout refresh - notify all contexts and refresh iframe
      notifyContentScriptsLogout();
      sendResponse({ layout: 'success', power: true, success: true });
    }

    return true;
  });

  async function notifyContentScripts() {
    if (!store) return;

    const state = store.getState();
    const iframeState = {
      layout: state.layout?.mode || 'compact',
      speed: state.layout?.speed || 'classic',
      position: state.layout?.position || 'top',
      opacity: state.layout?.opacity ?? 1.0,
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
      debugLogger.error(DEBUG_CATEGORIES.STORAGE, 'Failed to notify content scripts', error);
    }
  }

  async function notifyContentScriptsLogout() {
    try {
      const tabs = await browser.tabs.query({});

      for (const tab of tabs) {
        if (tab.id) {
          try {
            await browser.tabs.sendMessage(tab.id, {
              type: 'LOGOUT_REFRESH'
            });
          } catch (error) {
            // Tab might not have content script, ignore error
          }
        }
      }
    } catch (error) {
      debugLogger.error(DEBUG_CATEGORIES.STORAGE, 'Failed to notify content scripts of logout', error);
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
        debugLogger.error(DEBUG_CATEGORIES.STORAGE, 'Failed to save state to storage', error);
      }
    });

    debugLogger.info(DEBUG_CATEGORIES.STORAGE, 'Store initialized successfully');
  } catch (error) {
    debugLogger.error(DEBUG_CATEGORIES.STORAGE, 'Failed to initialize store', error);
    store = configureStore({ reducer: rootReducer });
  }
}