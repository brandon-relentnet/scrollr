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
        setState: (state, action) => action.payload,
    },
});

export const { setPower, togglePower, setState } = powerSlice.actions;
export default powerSlice.reducer;