// extensionStorage.js - Better approach for browser extensions

const loadState = async () => {
    try {
        // Check if we're in an extension environment
        if (typeof chrome === 'undefined' || !chrome.storage) {
            return undefined;
        }

        const result = await chrome.storage.local.get(['state']);
        return result.state || undefined;
    } catch (err) {
        console.error('Could not load state from extension storage:', err);
        return undefined;
    }
};

export const saveState = async (state) => {
    try {
        // Check if we're in an extension environment
        if (typeof chrome === 'undefined' || !chrome.storage) {
            return;
        }

        await chrome.storage.local.set({ state });
    } catch (err) {
        console.error('Could not save state to extension storage:', err);
    }
};

// Synchronous version with fallback to localStorage for compatibility
export const loadStateSync = () => {
    try {
        // Try localStorage first (for content scripts that have access)
        if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
            const serializedState = localStorage.getItem('state');
            if (serializedState === null) {
                return undefined;
            }
            return JSON.parse(serializedState);
        }
        return undefined;
    } catch (err) {
        console.error('Could not load state synchronously:', err);
        return undefined;
    }
};

export const saveStateSync = (state) => {
    try {
        // Try localStorage first (for content scripts that have access)
        if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
            const serializedState = JSON.stringify(state);
            localStorage.setItem('state', serializedState);
        }
    } catch (err) {
        console.error('Could not save state synchronously:', err);
    }
};

export default loadState;