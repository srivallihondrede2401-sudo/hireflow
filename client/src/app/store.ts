import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import authReducer from "../features/auth/authSlice";
import jobsReducer from "../features/jobs/jobsSlice";

export const store = configureStore({
  reducer: { auth: authReducer, jobs: jobsReducer },
});

// Persist the session so a refresh keeps you logged in
store.subscribe(() => {
  const { session } = store.getState().auth;
  try {
    if (session) localStorage.setItem("hireflow.session", JSON.stringify(session));
    else localStorage.removeItem("hireflow.session");
  } catch { /* ignore */ }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
