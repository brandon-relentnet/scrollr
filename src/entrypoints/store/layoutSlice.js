import { createSlice } from "@reduxjs/toolkit";

const layoutSlice = createSlice({
    name: "layout",
    initialState: {
        mode: 'compact',
    },
    reducers: {
        setLayout: (state, action) => {
            state.mode = action.payload;
        },
    },
});

export const { setLayout } = layoutSlice.actions;
export default layoutSlice.reducer;