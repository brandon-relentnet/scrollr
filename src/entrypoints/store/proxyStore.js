import { storage } from '#imports';

let currentState = null;
let listeners = [];

async function loadInitialState() {
    try {
        // Try to get state directly from storage first
        currentState = await storage.getItem('local:appState');

        // If not found, try messaging the background script
        if (!currentState && chrome?.runtime?.sendMessage) {
            return new Promise((resolve) => {
                chrome.runtime.sendMessage({ type: 'GET_STATE' }, (response) => {
                    if (response && response.state) currentState = response.state;
                    resolve();
                });
            });
        }
    } catch (error) {
        console.error('Failed to load initial state:', error);
    }
}

// Listen for storage changes using WXT's storage watcher
const unwatch = storage.watch('local:appState', (newValue) => {
    if (newValue !== undefined) {
        currentState = newValue;
        for (const listener of listeners) {
            listener();
        }
    }
});

function getState() {
    return currentState;
}

function dispatch(action) {
    return new Promise((resolve) => {
        if (chrome?.runtime?.sendMessage) {
            chrome.runtime.sendMessage({ type: 'DISPATCH_ACTION', action }, (response) => {
                if (response && response.state) {
                    currentState = response.state;
                    for (const listener of listeners) {
                        listener();
                    }
                }
                resolve(currentState);
            });
        } else {
            resolve(currentState);
        }
    });
}

function subscribe(listener) {
    listeners.push(listener);
    return () => {
        listeners = listeners.filter(l => l !== listener);
    };
}

function replaceReducer() { }

export async function initializeProxyStore() {
    await loadInitialState();
    return { getState, dispatch, subscribe, replaceReducer };
}