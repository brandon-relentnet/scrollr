import { createSlice } from "@reduxjs/toolkit";
import { STOCK_OPTIONS, CRYPTO_OPTIONS } from '@/entrypoints/popup/tabs/data';

// Helper to create default selections from options
const createDefaultSelections = (options) => 
    options.reduce((acc, opt) => ({ ...acc, [opt.key]: opt.enabled }), {});

const financeSlice = createSlice({
    name: "finance",
    initialState: {
        stocks: {
            enabled: false,
            activePreset: null,
            customSelections: createDefaultSelections(STOCK_OPTIONS),
            searchTerm: ''
        },
        crypto: {
            enabled: false,
            activePreset: null,
            customSelections: createDefaultSelections(CRYPTO_OPTIONS),
            searchTerm: ''
        }
    },
    reducers: {
        setFinance: (state, action) => {
            return action.payload;
        },
        toggleFinanceCategory: (state, action) => {
            const { category } = action.payload;
            state[category].enabled = !state[category].enabled;
        },
        setFinancePreset: (state, action) => {
            const { category, preset } = action.payload;
            state[category].activePreset = preset;
        },
        toggleFinanceSelection: (state, action) => {
            const { category, key } = action.payload;
            state[category].customSelections[key] = !state[category].customSelections[key];
        },
        setFinanceSearch: (state, action) => {
            const { category, term } = action.payload;
            state[category].searchTerm = term;
        },
        resetFinanceSelections: (state, action) => {
            const { category } = action.payload;
            const options = category === 'stocks' ? STOCK_OPTIONS : CRYPTO_OPTIONS;
            state[category].customSelections = createDefaultSelections(options);
        },
        toggleAllFinanceSelections: (state, action) => {
            const { category, selectAll } = action.payload;
            const options = category === 'stocks' ? STOCK_OPTIONS : CRYPTO_OPTIONS;
            const newSelections = {};
            for (const opt of options) {
                newSelections[opt.key] = selectAll;
            }
            state[category].customSelections = newSelections;
        },
        setState: (state, action) => action.payload
    },
});

export const {
    setFinance,
    toggleFinanceCategory,
    setFinancePreset,
    toggleFinanceSelection,
    setFinanceSearch,
    resetFinanceSelections,
    toggleAllFinanceSelections,
    setState
} = financeSlice.actions;

export default financeSlice.reducer;