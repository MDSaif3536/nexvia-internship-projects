import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api } from "../api.js";

export const fetchCourses = createAsyncThunk("catalog/fetch", async (q) => {
  const data = await api(`/api/courses${q ? `?q=${encodeURIComponent(q)}` : ""}`);
  return data.courses;
});

const slice = createSlice({
  name: "catalog",
  initialState: { items: [], status: "idle" },
  extraReducers: (b) => {
    b.addCase(fetchCourses.fulfilled, (s, a) => {
      s.items = a.payload;
      s.status = "ready";
    });
  }
});

export default slice.reducer;
