import { createSlice } from "@reduxjs/toolkit";

const powerSlice = createSlice({
    name: "power",
    initialState: {
        mode: true, // Default to enabled
    },
    reducers: {
        setPower: (state, action) => {
            state.mode = action.payload;
        },
        togglePower: (state) => {
            state.mode = !state.mode;
        },
    },
});

export const { setPower, togglePower } = powerSlice.actions;
export default powerSlice.reducer;