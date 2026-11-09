import { configureStore } from "@reduxjs/toolkit";
import auth from "./authSlice.js";
import catalog from "./catalogSlice.js";

export const store = configureStore({
  reducer: { auth, catalog }
});
