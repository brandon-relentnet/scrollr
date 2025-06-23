import { combineReducers } from "@reduxjs/toolkit";
import ThemeReducer from "./themeSlice.js";
import TogglesReducer from "./togglesSlice.js";
import FinanceReducer from "./financeSlice.js";
import PowerReducer from "./powerSlice.js";
import LayoutReducer from "./layoutSlice.js";
import RssReducer from "./rssSlice.js";
import PinnedReducer from "./pinnedSlice.js";

const rootReducer = combineReducers({
    // Add your reducers here
    theme: ThemeReducer,
    toggles: TogglesReducer,
    finance: FinanceReducer,
    power: PowerReducer,
    layout: LayoutReducer,
    rss: RssReducer,
    pinned: PinnedReducer,
})

export default rootReducer;