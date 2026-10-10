import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api } from "../../lib/api";
import type { Session } from "../../lib/types";

interface AuthState {
  session: Session | null;
  pending: boolean;
  error: string | null;
}

function restore(): Session | null {
  try {
    const raw = localStorage.getItem("hireflow.session");
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

const initialState: AuthState = { session: restore(), pending: false, error: null };

export const login = createAsyncThunk("auth/login", ({ email, password }: { email: string; password: string }) =>
  api.login(email, password),
);

export const register = createAsyncThunk(
  "auth/register",
  ({ name, email, password }: { name: string; email: string; password: string }) => api.register(name, email, password),
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (s) => { s.session = null; },
    clearError: (s) => { s.error = null; },
  },
  extraReducers: (b) => {
    for (const thunk of [login, register]) {
      b.addCase(thunk.pending, (s) => { s.pending = true; s.error = null; })
        .addCase(thunk.fulfilled, (s, a) => { s.pending = false; s.session = a.payload; })
        .addCase(thunk.rejected, (s, a) => { s.pending = false; s.error = a.error.message ?? "Something went wrong"; });
    }
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
