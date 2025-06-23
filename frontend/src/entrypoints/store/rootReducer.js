import { combineReducers } from "@reduxjs/toolkit";
import ThemeReducer from "./themeSlice.js";
import TogglesReducer from "./togglesSlice.js";
import FinanceReducer from "./financeSlice.js";
import PowerReducer from "./powerSlice.js";
import LayoutReducer from "./layoutSlice.js";
import RssReducer from "./rssSlice.js";

const rootReducer = combineReducers({
    // Add your reducers here
    theme: ThemeReducer,
    toggles: TogglesReducer,
    finance: FinanceReducer,
    power: PowerReducer,
    layout: LayoutReducer,
    rss: RssReducer,
})

export default rootReducer;