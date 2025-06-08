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

export default loadState;