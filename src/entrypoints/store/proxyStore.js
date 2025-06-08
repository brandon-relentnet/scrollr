if (typeof chrome === 'undefined' || !chrome.storage) {
    console.error('Chrome storage API not available');
}

let currentState = null;
let listeners = [];

function loadInitialState() {
    return new Promise((resolve) => {
        if (chrome && chrome.runtime && typeof chrome.runtime.sendMessage === 'function') {
            chrome.runtime.sendMessage({ type: 'GET_STATE' }, (response) => {
                if (response && response.state) currentState = response.state;
                resolve();
            });
        } else {
            resolve();
        }
    });
}

if (chrome && chrome.storage && chrome.storage.onChanged && typeof chrome.storage.onChanged.addListener === 'function') {
    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'local' && changes.appState) {
            currentState = changes.appState.newValue;
            for (const listener of listeners) {
                listener();
            }
        }
    });
}

function getState() {
    return currentState;
}

function dispatch(action) {
    return new Promise((resolve) => {
        if (chrome && chrome.runtime && typeof chrome.runtime.sendMessage === 'function') {
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