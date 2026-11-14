import { Route, Routes } from "react-router-dom";
import { AdminDashboardPage } from "../pages/AdminDashboardPage.tsx";
import { AdminLoginPage } from "../pages/AdminLoginPage.tsx";
import { HomePage } from "../pages/HomePage.tsx";

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/admin" element={<AdminDashboardPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
    </Routes>
  );
}
