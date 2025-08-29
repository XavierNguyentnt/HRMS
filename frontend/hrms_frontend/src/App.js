import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import LoginPage from "./components/Pages/Auth/LoginPage";
import RegisterPage from "./components/Pages/Auth/RegisterPage";
import ProfilePage from "./components/Pages/User/ProfilePage";
import DashboardPage from "./components/Pages/Dashboards/DashboardPage";

function App() {
  const { user } = useAuth();

  return (
    <div className="App">
      <Routes>
        {/* Route cho trang đăng nhập */}
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" /> : <LoginPage />}
        />

        {/* SỬA LỖI: Dùng <Route> thay vì <Routes> */}
        <Route
          path="/register"
          element={user ? <Navigate to="/dashboard" /> : <RegisterPage />}
        />

        {/* Route này có thể cần được bảo vệ */}
        <Route
          path="/profile"
          element={user ? <ProfilePage /> : <Navigate to="/login" />}
        />

        {/* Route cho trang Dashboard (Được bảo vệ) */}
        <Route
          path="/dashboard"
          element={user ? <DashboardPage /> : <Navigate to="/login" />}
        />

        {/* Route mặc định: điều hướng về đúng trang */}
        <Route
          path="*"
          element={
            user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />
          }
        />
      </Routes>
    </div>
  );
}

export default App;
