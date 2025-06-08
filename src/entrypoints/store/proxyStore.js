import { storage } from '#imports';

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
        console.error('Storage getItem failed:', error);
        return null;
    }
}

// Helper function to safely send browser messages
function safeSendMessage(message) {
    return new Promise((resolve) => {
        if (isBrowserRuntimeAvailable()) {
            try {
                // Store the function reference to avoid TypeScript UMD global variable error
                const sendMessage = browser.runtime.sendMessage;
                sendMessage.call(browser.runtime, message, (response) => {
                    resolve(response);
                });
            } catch (error) {
                console.error('Browser message failed:', error);
                resolve(null);
            }
        } else {
            resolve(null);
        }
    });
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
        console.error('Failed to load initial state:', error);
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
        console.error('Failed to initialize storage watcher:', error);
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
            console.error('Error calling listener:', error);
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
        console.error('Dispatch failed:', error);
        return currentState;
    }
}

function subscribe(listener) {
    if (typeof listener !== 'function') {
        console.warn('Subscribe called with non-function listener');
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
        console.error('Failed to initialize proxy store:', error);
        // Return a fallback store
        return {
            getState: () => null,
            dispatch: async () => null,
            subscribe: () => () => {},
            replaceReducer: () => {}
        };
    }
}