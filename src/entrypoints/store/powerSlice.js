import { createSlice } from "@reduxjs/toolkit";

const powerSlice = createSlice({
    name: "power",
    initialState: {
        mode: false,
    },
    reducers: {
        setPower: (state, action) => action.payload,
    },
});

export const { setPower } = powerSlice.actions;
export default powerSlice.reducer;