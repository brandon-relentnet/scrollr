import { createSlice } from "@reduxjs/toolkit";

const togglesSlice = createSlice({
    name: "toggles",
    initialState: {
        mode: "", // Default theme mode
        debugMode: false, // Debug logging enabled/disabled
        debugCategories: [], // Specific debug categories to show
    },
    reducers: {
        setToggles: (state, action) => action.payload,
        setState: (state, action) => action.payload,
        setDebugMode: (state, action) => {
            state.debugMode = action.payload.enabled;
            state.debugCategories = action.payload.categories || [];
        },
        toggleDebugCategory: (state, action) => {
            const category = action.payload;
            const index = state.debugCategories.indexOf(category);
            if (index >= 0) {
                state.debugCategories.splice(index, 1);
            } else {
                state.debugCategories.push(category);
            }
        },
    },
});

export const { setToggles, setState, setDebugMode, toggleDebugCategory } = togglesSlice.actions;
export default togglesSlice.reducer;