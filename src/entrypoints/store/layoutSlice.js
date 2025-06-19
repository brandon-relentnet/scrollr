import { createSlice } from "@reduxjs/toolkit";

const layoutSlice = createSlice({
    name: "layout",
    initialState: {
        mode: 'compact',
        speed: 'classic', // slow, classic, fast
        position: 'top', // top, bottom
    },
    reducers: {
        setLayout: (state, action) => {
            state.mode = action.payload;
        },
        setSpeed: (state, action) => {
            state.speed = action.payload;
        },
        toggleSpeed: (state) => {
            const speeds = ['slow', 'classic', 'fast'];
            const currentIndex = speeds.indexOf(state.speed);
            const nextIndex = (currentIndex + 1) % speeds.length;
            state.speed = speeds[nextIndex];
        },
        setPosition: (state, action) => {
            state.position = action.payload;
        },
        togglePosition: (state) => {
            state.position = state.position === 'top' ? 'bottom' : 'top';
        },
        setState: (state, action) => action.payload,
    },
});

export const { setLayout, setSpeed, toggleSpeed, setPosition, togglePosition, setState } = layoutSlice.actions;
export default layoutSlice.reducer;