// src/contexts/AuthContext.js

import React, { createContext, useContext, useState, useEffect } from "react";
// SỬA LỖI 1: Import từ đúng file và đúng đường dẫn
import { loginUser, registerUser } from "../api/authAPI";
import * as odooApi from "../services/api";

/**
 * Định nghĩa các vai trò (Roles) trong hệ thống để quản lý quyền hạn.
 * Việc export hằng số này giúp các component khác có thể sử dụng mà không cần import từ file này.
 */
export const ROLES = {
  ADMIN: "admin",
  MANAGER: "manager",
  STAFF: "staff",
  UNKNOWN: "unknown",
};

/**
 * Hàm pomocniczy để xác định vai trò dựa trên chức danh.
 * @param {string} jobTitle - Chức danh của nhân viên.
 * @returns {string} - Vai trò tương ứng từ ROLES.
 */
const getUserRole = (jobTitle) => {
  if (!jobTitle) return ROLES.UNKNOWN;
  const title = jobTitle.toLowerCase();

  // Lưu ý: Logic này dựa vào chuỗi. Một giải pháp mạnh mẽ hơn trong tương lai
  // là kiểm tra nhóm quyền (security groups) của người dùng từ Odoo.
  if (title.includes("admin") || title.includes("quản trị")) {
    return ROLES.ADMIN;
  }
  const managerTitles = [
    "chủ nhiệm",
    "chánh văn phòng",
    "trưởng ban",
    "phó trưởng ban",
    "manager",
  ];
  if (managerTitles.some((t) => title.includes(t))) {
    return ROLES.MANAGER;
  }
  // Mọi trường hợp còn lại mặc định là nhân viên
  return ROLES.STAFF;
};

// Tạo Context
const AuthContext = createContext(null);

// Hook tùy chỉnh để dễ dàng sử dụng context
export function useAuth() {
  return useContext(AuthContext);
}

// Component Provider chính
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(ROLES.UNKNOWN);
  const [isLoading, setIsLoading] = useState(true); // Thêm state loading ban đầu

  // States cho các hoạt động cụ thể
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [isRegisterLoading, setIsRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState(null);
  const [isUpdateLoading, setIsUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Tự động tải session từ localStorage khi ứng dụng khởi động
  useEffect(() => {
    try {
      const storedSession = localStorage.getItem("userSession");
      if (storedSession) {
        const sessionData = JSON.parse(storedSession);
        setUser(sessionData);
        setRole(getUserRole(sessionData.job_title));
      }
    } catch (error) {
      console.error("Lỗi khi đọc user session từ localStorage:", error);
      localStorage.removeItem("userSession"); // Xóa session bị lỗi
    } finally {
      setIsLoading(false); // Kết thúc trạng thái loading ban đầu
    }
  }, []);

  /**
   * Xử lý logic đăng nhập.
   */
  const handleLogin = async (identifier, password) => {
    setIsLoginLoading(true);
    setLoginError(null);
    try {
      const sessionInfo = await loginUser(identifier, password);
      const profile = await odooApi.fetchUserProfile(sessionInfo.uid);

      // TỐI ƯU: Gộp object theo thứ tự đúng, thông tin chi tiết từ `profile` sẽ ghi đè lên thông tin cơ bản từ `sessionInfo`.
      const userSession = { ...sessionInfo, ...profile };

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

  /**
   * Xử lý logic đăng xuất.
   */
  const handleLogout = () => {
    setUser(null);
    setRole(ROLES.UNKNOWN);
    localStorage.removeItem("userSession");
  };

  /**
   * Xử lý logic đăng ký.
   */
  const handleRegister = async (signupData) => {
    setIsRegisterLoading(true);
    setRegisterError(null);
    try {
      const result = await registerUser(signupData);
      return result.success || false;
    } catch (error) {
      setRegisterError(error.message || "Không thể kết nối đến máy chủ.");
      return false;
    } finally {
      setIsRegisterLoading(false);
    }
  };

  /**
   * Xử lý logic cập nhật hồ sơ cá nhân.
   * Hàm này cực kỳ quan trọng để đồng bộ dữ liệu.
   */
  const handleUpdateProfile = async (updateData = {}) => {
    if (!user) return false;

    setIsUpdateLoading(true);
    setUpdateError(null);
    setUpdateSuccess(false);

    try {
      // Chỉ gọi API `write` nếu thực sự có dữ liệu cần thay đổi.
      // Nếu `updateData` rỗng, ta chỉ đang muốn làm mới dữ liệu.
      if (Object.keys(updateData).length > 0) {
        await odooApi.updateProfile(user.id, updateData);
      }

      // Luôn luôn tải lại thông tin mới nhất từ server để đảm bảo đồng bộ
      const freshProfile = await odooApi.fetchUserProfile(user.uid);

      // Gộp lại với session hiện tại, dữ liệu mới sẽ ghi đè lên dữ liệu cũ
      const updatedSession = { ...user, ...freshProfile };

      // Cập nhật state và localStorage, đây là bước quan trọng nhất
      setUser(updatedSession);
      setRole(getUserRole(updatedSession.job_title));
      localStorage.setItem("userSession", JSON.stringify(updatedSession));

      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000); // Tự động ẩn thông báo
      return true;
    } catch (err) {
      setUpdateError(err.message || "Cập nhật thông tin thất bại.");
      return false;
    } finally {
      setIsUpdateLoading(false);
    }
  };

  // Các giá trị được cung cấp cho toàn bộ ứng dụng
  const value = {
    user,
    role,
    ROLES, // Cung cấp cả hằng số ROLES để tiện sử dụng
    isLoading, // State loading ban đầu của context
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
