import React, { createContext, useContext, useState } from "react";
import * as odooApi from "../services/odooAPI";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // --- STATE CHUNG ---
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("userSession");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
      console.error("Failed to parse user session from localStorage", error);
      return null;
    }
  });

  // --- STATE CHO LOGIN ---
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);

  // --- STATE CHO REGISTER ---
  const [isRegisterLoading, setIsRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState(null);

  // --- STATE CHO PROFILE UPDATE ---
  const [isUpdateLoading, setIsUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // === CÁC HÀM XỬ LÝ LOGIC ===

  const handleLogin = async (email, password) => {
    setIsLoginLoading(true);
    setLoginError(null);
    try {
      // Bước 1: Lấy session info cơ bản
      const sessionInfo = await odooApi.login(email, password);

      // Bước 2: Lấy thông tin profile chi tiết từ hr.employee
      const employeeProfile = await odooApi.fetchUserProfile(sessionInfo.uid);

      // Bước 3: Gộp 2 object lại để có user state hoàn chỉnh
      const fullUserSession = { ...sessionInfo, ...employeeProfile };

      setUser(fullUserSession);
      localStorage.setItem("userSession", JSON.stringify(fullUserSession));

      return fullUserSession;
    } catch (err) {
      setLoginError(err.message || "Lỗi kết nối server. Vui lòng thử lại.");
      return null;
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("userSession");
  };

  const handleRegister = async (userData) => {
    setIsRegisterLoading(true);
    setRegisterError(null);
    try {
      const response = await odooApi.register(userData);
      const newSession = response.data;
      setUser(newSession);
      localStorage.setItem("userSession", JSON.stringify(newSession));
      return true;
    } catch (err) {
      const errorMessage =
        err.response?.data?.data?.message ||
        err.message ||
        "Đăng ký không thành công.";
      setRegisterError(errorMessage);
      return false;
    } finally {
      setIsRegisterLoading(false);
    }
  };

  const handleUpdateProfile = async (updateData) => {
    setIsUpdateLoading(true);
    setUpdateError(null);
    setUpdateSuccess(false);

    // ID của nhân viên (hr.employee) được lưu trong user.id
    if (!user || !user.id) {
      setUpdateError("Không tìm thấy ID nhân viên để cập nhật.");
      setIsUpdateLoading(false);
      return false;
    }

    try {
      // Bước 1: Gửi yêu cầu cập nhật lên server
      await odooApi.updateProfile(user.id, updateData);

      // Bước 2: Lấy lại toàn bộ thông tin mới nhất từ server để đảm bảo đồng bộ
      const freshProfile = await odooApi.fetchUserProfile(user.uid);

      // Bước 3: Cập nhật state toàn cục với thông tin mới
      const updatedSession = { ...user, ...freshProfile };
      setUser(updatedSession);
      localStorage.setItem("userSession", JSON.stringify(updatedSession));

      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000); // Tự động ẩn thông báo thành công sau 3s
      return true;
    } catch (err) {
      setUpdateError(err.message || "Cập nhật thông tin thất bại.");
      return false;
    } finally {
      setIsUpdateLoading(false);
    }
  };

  // Giá trị cung cấp cho toàn bộ ứng dụng
  const value = {
    user,
    handleLogout,
    handleLogin,
    isLoginLoading, // Đổi tên cho rõ ràng
    loginError,

    handleRegister,
    isRegisterLoading,
    registerError,

    handleUpdateProfile,
    isUpdateLoading,
    updateError,
    updateSuccess,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
