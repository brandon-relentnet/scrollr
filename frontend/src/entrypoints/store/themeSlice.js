import { createSlice } from "@reduxjs/toolkit";

const themeSlice = createSlice({
  name: "theme",
  initialState: {
    mode: "scrollr", // Default theme mode
  },
  reducers: {
    setTheme: (state, action) => {
      // Handle both string and object formats
      if (typeof action.payload === "string") {
        state.mode = action.payload;
      } else {
        return action.payload;
      }
    },
    setState: (state, action) => action.payload,
  },
});

export const { setTheme, setState } = themeSlice.actions;
export default themeSlice.reducer;
