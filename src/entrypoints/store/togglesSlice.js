import { createSlice } from "@reduxjs/toolkit";

const togglesSlice = createSlice({
    name: "toggles",
    initialState: {
        mode: "", // Default theme mode
    },
    reducers: {
        setToggles: (state, action) => action.payload,
    },
});

export const { setToggles } = togglesSlice.actions;
export default togglesSlice.reducer;