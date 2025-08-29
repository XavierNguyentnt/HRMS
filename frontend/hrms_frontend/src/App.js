import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import LoginPage from "./components/Pages/Auth/LoginPage"; // Giả sử LoginPage nằm ở src/components
import DashboardPage from "./components/Pages/Dashboards/DashboardPage"; // Import trang Dashboard vừa tạo

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
