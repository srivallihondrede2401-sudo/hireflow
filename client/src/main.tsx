import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { store, useAppDispatch, useAppSelector } from "./app/store";
import { fetchJobs } from "./features/jobs/jobsSlice";
import { Layout } from "./components/Layout";
import { LoginPage } from "./pages/LoginPage";
import { BoardPage } from "./pages/BoardPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import "./styles.css";

function App() {
  const token = useAppSelector((s) => s.auth.session?.token);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (token) dispatch(fetchJobs());
  }, [token, dispatch]);

  if (!token) return <LoginPage />;
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<BoardPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      {/* HashRouter keeps deep links working on GitHub Pages */}
      <HashRouter>
        <App />
      </HashRouter>
    </Provider>
  </StrictMode>,
);
