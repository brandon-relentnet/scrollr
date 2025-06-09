import { createSlice } from "@reduxjs/toolkit";

const financeSlice = createSlice({
    name: "finance",
    initialState: {
        stocks: {
            enabled: false,
            activePreset: null,
            customSelections: {},
            searchTerm: ''
        },
        crypto: {
            enabled: false,
            activePreset: null,
            customSelections: {},
            searchTerm: ''
        }
    },
    reducers: {
        setFinance: (state, action) => {
            // Replace the entire finance state
            return action.payload;
        },
        updateFinanceCategory: (state, action) => {
            // Update a specific category (stocks or crypto)
            const { category, data } = action.payload;
            state[category] = { ...state[category], ...data };
        },
        toggleFinanceCategory: (state, action) => {
            // Toggle enabled state for a category
            const { category } = action.payload;
            state[category].enabled = !state[category].enabled;
        },
        setFinancePreset: (state, action) => {
            // Set active preset for a category
            const { category, preset } = action.payload;
            state[category].activePreset = preset;
        }
    },
});

export const {
    setFinance,
    updateFinanceCategory,
    toggleFinanceCategory,
    setFinancePreset
} = financeSlice.actions;

export default financeSlice.reducer;