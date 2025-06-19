import { createSlice } from "@reduxjs/toolkit";

const themeSlice = createSlice({
    name: "theme",
    initialState: {
        mode: "dark", // Default theme mode
    },
    reducers: {
        setTheme: (state, action) => action.payload,
        setState: (state, action) => action.payload,
    },
});

export const { setTheme, setState } = themeSlice.actions;
export default themeSlice.reducer;