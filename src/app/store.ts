import { configureStore } from '@reduxjs/toolkit';

import orderBookReducer from '../features/OrderBook/orderBookSlice';

export const store = configureStore({
  reducer: { orderBook: orderBookReducer },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
