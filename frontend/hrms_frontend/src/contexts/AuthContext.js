// src/contexts/AuthContext.js

import React, { createContext, useContext, useState, useEffect } from "react";
// SỬA LỖI 1: Import từ đúng file và đúng đường dẫn
import { loginUser, registerUser } from "../api/authAPI";
import * as odooApi from "../services/api";

export const ROLES = {
  ADMIN: "admin",
  MANAGER: "manager",
  STAFF: "staff",
  UNKNOWN: "unknown",
};

const getUserRole = (jobTitle) => {
  if (!jobTitle) return ROLES.UNKNOWN;
  const title = jobTitle.toLowerCase();
  if (title.includes("admin") || title.includes("quản trị")) {
    return ROLES.ADMIN;
  }
  const managerTitles = [
    "chủ nhiệm",
    "chánh văn phòng",
    "trưởng ban",
    "phó trưởng ban",
  ];
  if (managerTitles.some((t) => title.includes(t))) {
    return ROLES.MANAGER;
  }
  const staffTitles = ["nghiên cứu viên", "chuyên viên"];
  if (staffTitles.some((t) => title.includes(t))) {
    return ROLES.STAFF;
  }
  return ROLES.STAFF;
};

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(ROLES.UNKNOWN);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [isRegisterLoading, setIsRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState(null);

  // Các state cho cập nhật profile
  const [isUpdateLoading, setIsUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  useEffect(() => {
    const storedSession = localStorage.getItem("userSession");
    if (storedSession) {
      const sessionData = JSON.parse(storedSession);
      setUser(sessionData);
      setRole(getUserRole(sessionData.job_title));
    }
  }, []);

  const handleLogin = async (identifier, password) => {
    setIsLoginLoading(true);
    setLoginError(null);
    try {
      // SỬA LỖI 2: Gọi hàm `loginUser` đã import
      const sessionInfo = await loginUser(identifier, password);

      const profile = await odooApi.fetchUserProfile(sessionInfo.uid);
      const userSession = { ...profile, ...sessionInfo };

      setUser(userSession);
      setRole(getUserRole(userSession.job_title));
      localStorage.setItem("userSession", JSON.stringify(userSession));

      return userSession;
    } catch (error) {
      setLoginError(error.message || "Thông tin đăng nhập không chính xác.");
      return null;
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setRole(ROLES.UNKNOWN);
    localStorage.removeItem("userSession");
  };

  const handleRegister = async (signupData) => {
    setIsRegisterLoading(true);
    setRegisterError(null);
    try {
      const result = await registerUser(signupData);

      if (result && result.success) {
        return true;
      } else {
        // Nếu backend có trả về thông báo lỗi chi tiết
        setRegisterError(result.error || "Đăng ký thất bại!");
        return false;
      }
    } catch (error) {
      setRegisterError(error.message || "Không thể kết nối đến máy chủ.");
      return false;
    } finally {
      setIsRegisterLoading(false);
    }
  };

  const handleUpdateProfile = async (updateData) => {
    setIsUpdateLoading(true);
    setUpdateError(null);
    setUpdateSuccess(false);
    // user.id ở đây là ID của hr.employee
    if (!user || !user.id) {
      setUpdateError("Không tìm thấy ID nhân viên để cập nhật.");
      setIsUpdateLoading(false);
      return false;
    }

    try {
      // Gọi API cập nhật hr.employee bằng user.id
      await odooApi.updateProfile(user.id, updateData);

      // Lấy lại thông tin employee mới nhất bằng user.uid (ID của res.users)
      const freshProfile = await odooApi.fetchUserProfile(user.uid);
      const updatedSession = { ...user, ...freshProfile };

      setUser(updatedSession);
      setRole(getUserRole(updatedSession.job_title));
      localStorage.setItem("userSession", JSON.stringify(updatedSession));

      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
      return true;
    } catch (err) {
      setUpdateError(err.message || "Cập nhật thông tin thất bại.");
      return false;
    } finally {
      setIsUpdateLoading(false);
    }
  };

  const value = {
    user,
    role,
    handleLogout,
    handleLogin,
    isLoginLoading,
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
