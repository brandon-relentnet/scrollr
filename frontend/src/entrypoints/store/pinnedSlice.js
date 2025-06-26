import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [], // Array of pinned items with type and data
};

const pinnedSlice = createSlice({
  name: 'pinned',
  initialState,
  reducers: {
    addPinnedItem: (state, action) => {
      const { type, data } = action.payload;
      const id = type === 'finance' ? data.symbol : data.id;
      
      // Check if already pinned
      const exists = state.items.find(item => 
        item.type === type && (
          item.data.symbol === id || 
          item.data.id === id
        )
      );
      
      if (!exists) {
        state.items.push({ type, data });
      }
    },
    
    removePinnedItem: (state, action) => {
      const { type, id } = action.payload;
      state.items = state.items.filter(item => 
        !(item.type === type && (
          item.data.symbol === id || 
          item.data.id === id
        ))
      );
    },
    
    clearAllPinned: (state) => {
      state.items = [];
    },
    
    // Update pinned finance items with fresh data
    updatePinnedFinanceData: (state, action) => {
      const freshTradesData = action.payload; // Array of fresh trade data
      
      state.items = state.items.map(item => {
        if (item.type === 'finance') {
          // Find fresh data for this pinned trade
          const freshTrade = freshTradesData.find(trade => trade.symbol === item.data.symbol);
          if (freshTrade) {
            // Update the pinned item with fresh data
            return { ...item, data: freshTrade };
          }
        }
        return item;
      });
    },
    
    // Set entire state (for loading from server/storage)
    setState: (state, action) => {
      return { ...initialState, ...action.payload };
    }
  },
});

export const {
  addPinnedItem,
  removePinnedItem,
  clearAllPinned,
  updatePinnedFinanceData,
  setState
} = pinnedSlice.actions;

// Selectors
export const selectPinnedItems = (state) => state.pinned?.items || [];
export const selectHasPinnedItems = (state) => (state.pinned?.items || []).length > 0;
export const selectIsItemPinned = (state, type, id) => {
  const items = state.pinned?.items || [];
  return items.some(item => 
    item.type === type && (
      item.data.symbol === id || 
      item.data.id === id
    )
  );
};

export default pinnedSlice.reducer;