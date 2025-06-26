import {storage} from '#imports';
import debugLogger, { DEBUG_CATEGORIES } from '../utils/debugLogger.js';

let currentState = null;
let listeners = [];

// Helper function to safely check if browser runtime messaging is available
function isBrowserRuntimeAvailable() {
    return typeof browser !== 'undefined' &&
        browser &&
        browser.runtime &&
        typeof browser.runtime.sendMessage === 'function';
}

// Helper function to safely call storage.getItem
async function safeGetItem(key) {
    try {
        if (storage && typeof storage.getItem === 'function') {
            return await storage.getItem(key);
        }
        return null;
    } catch (error) {
        debugLogger.error(DEBUG_CATEGORIES.STORAGE, 'Storage getItem failed', error);
        return null;
    }
}

// Helper function to safely send browser messages
async function safeSendMessage(message) {
    try {
        if (isBrowserRuntimeAvailable()) {
            // Use the promise-based approach which is standard for modern browser extensions
            return await browser.runtime.sendMessage(message);
        }
        return null;
    } catch (error) {
        debugLogger.error(DEBUG_CATEGORIES.STORAGE, 'Browser message failed', error);
        return null;
    }
}

async function loadInitialState() {
    try {
        // Try to get state directly from storage first
        currentState = await safeGetItem('local:appState');

        // If not found, try messaging the background script
        if (!currentState && isBrowserRuntimeAvailable()) {
            const response = await safeSendMessage({ type: 'GET_STATE' });
            if (response && response.state) {
                currentState = response.state;
            }
        }
    } catch (error) {
        debugLogger.error(DEBUG_CATEGORIES.STORAGE, 'Failed to load initial state', error);
    }
}

// Listen for storage changes using WXT's storage watcher
function initializeStorageWatcher() {
    try {
        if (storage && typeof storage.watch === 'function') {
            storage.watch('local:appState', (newValue) => {
                if (newValue !== undefined) {
                    currentState = newValue;
                    notifyListeners();
                }
            });
        }
    } catch (error) {
        debugLogger.error(DEBUG_CATEGORIES.STORAGE, 'Failed to initialize storage watcher', error);
    }
}

// Helper function to notify all listeners
function notifyListeners() {
    for (const listener of listeners) {
        try {
            if (typeof listener === 'function') {
                listener();
            }
        } catch (error) {
            debugLogger.error(DEBUG_CATEGORIES.STORAGE, 'Error calling listener', error);
        }
    }
}

function getState() {
    return currentState;
}

async function dispatch(action) {
    try {
        if (isBrowserRuntimeAvailable()) {
            const response = await safeSendMessage({
                type: 'DISPATCH_ACTION',
                action
            });

            if (response && response.state) {
                currentState = response.state;
                notifyListeners();
            }
        }
        return currentState;
    } catch (error) {
        debugLogger.error(DEBUG_CATEGORIES.STORAGE, 'Dispatch failed', error);
        return currentState;
    }
}

function subscribe(listener) {
    if (typeof listener !== 'function') {
        debugLogger.warn(DEBUG_CATEGORIES.STORAGE, 'Subscribe called with non-function listener');
        return () => {}; // Return no-op unsubscribe function
    }

    listeners.push(listener);

    return () => {
        listeners = listeners.filter(l => l !== listener);
    };
}

function replaceReducer() {
    // No-op implementation
}

export async function initializeProxyStore() {
    try {
        await loadInitialState();
        initializeStorageWatcher();

        return {
            getState,
            dispatch,
            subscribe,
            replaceReducer
        };
    } catch (error) {
        debugLogger.error(DEBUG_CATEGORIES.STORAGE, 'Failed to initialize proxy store', error);
        // Return a fallback store
        return {
            getState: () => null,
            dispatch: async () => null,
            subscribe: () => () => {},
            replaceReducer: () => {}
        };
    }
}