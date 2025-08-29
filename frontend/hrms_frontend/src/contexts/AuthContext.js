import React, { createContext, useContext, useState } from "react";
import * as odooApi from "../services/odooAPI";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("userSession");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
      console.error("Failed to parse user session from localStorage", error);
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null); // State này sẽ được LoginPage sử dụng

  const handleLogin = async (email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const sessionInfo = await odooApi.login(email, password);
      setUser(sessionInfo); // Đăng nhập thành công, lưu user vào state toàn cục
      localStorage.setItem("userSession", JSON.stringify(sessionInfo));
      return sessionInfo; // Trả về sessionInfo để LoginPage biết là đã thành công
    } catch (err) {
      // Đưa logic xử lý lỗi vào đây để quản lý tập trung
      // Dựa vào message trả về từ odooAPI.js
      setError(err.message || "Lỗi kết nối server. Vui lòng thử lại.");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("userSession");
  };

  const value = { user, isLoading, error, handleLogin, handleLogout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
