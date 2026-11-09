import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api, getToken, setToken } from "../api.js";

export const bootstrap = createAsyncThunk("auth/bootstrap", async () => {
  if (!getToken()) return { user: null };
  const data = await api("/api/auth/me");
  return data;
});

export const login = createAsyncThunk("auth/login", async (body) => {
  const data = await api("/api/auth/login", { method: "POST", body });
  setToken(data.token);
  return data;
});

export const register = createAsyncThunk("auth/register", async (body) => {
  const data = await api("/api/auth/register", { method: "POST", body });
  setToken(data.token);
  return data;
});

const slice = createSlice({
  name: "auth",
  initialState: { user: null, status: "idle", error: "" },
  reducers: {
    logout(state) {
      state.user = null;
      setToken(null);
    }
  },
  extraReducers: (b) => {
    const pending = (s) => {
      s.status = "loading";
      s.error = "";
    };
    const ok = (s, a) => {
      s.status = "ready";
      s.user = a.payload.user;
    };
    const fail = (s, a) => {
      s.status = "ready";
      s.error = a.error.message;
    };
    b.addCase(bootstrap.pending, pending)
      .addCase(bootstrap.fulfilled, ok)
      .addCase(bootstrap.rejected, (s) => {
        s.status = "ready";
        s.user = null;
        setToken(null);
      })
      .addCase(login.pending, pending)
      .addCase(login.fulfilled, ok)
      .addCase(login.rejected, fail)
      .addCase(register.pending, pending)
      .addCase(register.fulfilled, ok)
      .addCase(register.rejected, fail);
  }
});

export const { logout } = slice.actions;
export default slice.reducer;
