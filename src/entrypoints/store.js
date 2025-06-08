import { configureStore } from '@reduxjs/toolkit';
import loadState, { saveState } from './localStorage.js';

// Import all reducers
import themeReducer from '@/entrypoints/store/themeSlice.js';

const preloadedState = loadState();

const store = configureStore({
    reducer: {
        theme: themeReducer,
    },
    preloadedState, // Load initial state from local storage
});

// Save state to local storage whenever the store updates
store.subscribe(() => {
    saveState(store.getState());
});

export default store;