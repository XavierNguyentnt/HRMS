// src/components/Routes/PrivateRoute.js
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

function PrivateRoute({ children }) {
  const { user, isLoading } = useAuth();

  // 🕒 1. Chờ AuthContext khởi tạo xong
  if (isLoading) return null;

  // ✅ 2. Nếu chưa đăng nhập → về /login
  if (!user) return <Navigate to="/login" replace />;

  // ✅ 3. Nếu đã đăng nhập → hiển thị nội dung (children hoặc nested routes)
  return children ? children : <Outlet />;
}

export default PrivateRoute;
