import { combineReducers } from "@reduxjs/toolkit";
import ThemeReducer from "./themeSlice.js";

const rootReducer = combineReducers({
    // Add your reducers here
    theme: ThemeReducer,
})

export default rootReducer;