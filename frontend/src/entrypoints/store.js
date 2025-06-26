import { configureStore } from '@reduxjs/toolkit';
import loadState, { saveState } from './extensionStorage.js';
import rootReducer from '@/entrypoints/store/rootReducer.js';
import debugLogger, { DEBUG_CATEGORIES } from './utils/debugLogger.js';

// Create store with all reducers
const store = configureStore({
    reducer: rootReducer,
    // No preloadedState - we'll load it asynchronously
});

// Load saved state asynchronously and merge it with current state
const initializePersistedState = async () => {
    try {
        const persistedState = await loadState();
        if (persistedState) {
            // Dispatch an action to load the persisted state
            // You'll need to add this action to your slices
            store.dispatch({ type: 'LOAD_PERSISTED_STATE', payload: persistedState });
        }
    } catch (error) {
        debugLogger.error(DEBUG_CATEGORIES.STORAGE, 'Failed to load persisted state', error);
    }
};

// Initialize persisted state
// Note: In WXT extensions, window is always available, so the check is optional
initializePersistedState().catch(error => {
    debugLogger.error(DEBUG_CATEGORIES.STORAGE, 'Failed to initialize persisted state', error);
});

// Save state to extension storage whenever the store updates
// Debounce saves to avoid too frequent storage writes
let saveTimeout;
store.subscribe(() => {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => {
        try {
            await saveState(store.getState());
        } catch (error) {
            debugLogger.error(DEBUG_CATEGORIES.STORAGE, 'Failed to save state', error);
        }
    }, 500); // Save 500ms after last change
});

export default store;