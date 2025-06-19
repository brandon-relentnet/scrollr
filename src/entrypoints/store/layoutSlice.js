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
        setState: (state, action) => action.payload,
    },
});

export const { setLayout, setState } = layoutSlice.actions;
export default layoutSlice.reducer;