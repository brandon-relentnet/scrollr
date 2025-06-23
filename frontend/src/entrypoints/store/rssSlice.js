import { createSlice } from "@reduxjs/toolkit";

const rssSlice = createSlice({
    name: "rss",
    initialState: {
        enabled: false,
        feeds: [], // Array of RSS feed objects
        customSelections: {}, // Which feeds are selected for display
        searchTerm: ''
    },
    reducers: {
        setRssEnabled: (state, action) => {
            state.enabled = action.payload;
        },
        addRssFeed: (state, action) => {
            // action.payload = { id, name, url, category }
            state.feeds.push(action.payload);
            // Auto-enable the new feed
            state.customSelections[action.payload.id] = true;
        },
        removeRssFeed: (state, action) => {
            const feedId = action.payload;
            state.feeds = state.feeds.filter(feed => feed.id !== feedId);
            delete state.customSelections[feedId];
        },
        updateRssFeed: (state, action) => {
            const { id, updates } = action.payload;
            const index = state.feeds.findIndex(feed => feed.id === id);
            if (index !== -1) {
                state.feeds[index] = { ...state.feeds[index], ...updates };
            }
        },
        toggleRssSelection: (state, action) => {
            const feedId = action.payload;
            state.customSelections[feedId] = !state.customSelections[feedId];
        },
        setRssSearch: (state, action) => {
            state.searchTerm = action.payload;
        },
        toggleAllRssSelections: (state, action) => {
            const selectAll = action.payload;
            state.feeds.forEach(feed => {
                state.customSelections[feed.id] = selectAll;
            });
        },
        resetRssSelections: (state) => {
            state.customSelections = {};
        },
        setRssFeeds: (state, action) => {
            state.feeds = action.payload;
        },
        setState: (state, action) => action.payload,
    },
});

export const {
    setRssEnabled,
    addRssFeed,
    removeRssFeed,
    updateRssFeed,
    toggleRssSelection,
    setRssSearch,
    toggleAllRssSelections,
    resetRssSelections,
    setRssFeeds,
    setState
} = rssSlice.actions;

export default rssSlice.reducer;