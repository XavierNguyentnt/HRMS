import React, { createContext, useContext, useState, useEffect } from "react";
import * as odooApi from "../services/odooAPI";

// ĐỊNH NGHĨA CÁC VAI TRÒ (giữ nguyên)
export const ROLES = {
  ADMIN: "admin",
  MANAGER: "manager", // Gồm các chức danh quản lý
  STAFF: "staff", // Gồm các chức danh nhân viên
  UNKNOWN: "unknown",
};

// Hàm helper để xác định vai trò từ chức danh (giữ nguyên)
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

  // THAY ĐỔI 1: THÊM STATE ĐỂ LƯU VAI TRÒ (ROLE) CỦA NGƯỜI DÙNG
  const [role, setRole] = useState(ROLES.UNKNOWN);

  // --- CÁC STATE KHÁC GIỮ NGUYÊN ---
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [isRegisterLoading, setIsRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState(null);
  const [isUpdateLoading, setIsUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // THAY ĐỔI 2: DÙNG useEffect ĐỂ SET ROLE KHI USER ĐƯỢC TẢI LẠI TỪ LOCALSTORAGE
  // Điều này đảm bảo khi F5 lại trang, vai trò vẫn được xác định đúng.
  useEffect(() => {
    if (user && user.job_title) {
      setRole(getUserRole(user.job_title));
    } else {
      setRole(ROLES.UNKNOWN);
    }
  }, [user]); // Hook này sẽ chạy mỗi khi object `user` thay đổi.

  // === CÁC HÀM XỬ LÝ LOGIC ===

  const handleLogin = async (email, password) => {
    setIsLoginLoading(true);
    setLoginError(null);
    try {
      const sessionInfo = await odooApi.login(email, password);
      const employeeProfile = await odooApi.fetchUserProfile(sessionInfo.uid);
      const fullUserSession = { ...sessionInfo, ...employeeProfile };

      // THAY ĐỔI 3A: CẬP NHẬT CẢ USER VÀ ROLE SAU KHI ĐĂNG NHẬP THÀNH CÔNG
      setUser(fullUserSession);
      setRole(getUserRole(fullUserSession.job_title)); // Xác định vai trò từ chức danh
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
    setRole(ROLES.UNKNOWN); // Reset role khi logout
    localStorage.removeItem("userSession");
  };

  const handleRegister = async (userData) => {
    // Logic register không cần thay đổi vì sau khi register thành công
    // thường sẽ yêu cầu user đăng nhập lại.
    setIsRegisterLoading(true);
    setRegisterError(null);
    // ... code giữ nguyên ...
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
      await odooApi.updateProfile(user.id, updateData);
      const freshProfile = await odooApi.fetchUserProfile(user.uid);
      const updatedSession = { ...user, ...freshProfile };

      // THAY ĐỔI 3B: CẬP NHẬT CẢ USER VÀ ROLE KHI PROFILE THAY ĐỔI
      // Quan trọng khi chức danh của người dùng có thể được cập nhật.
      setUser(updatedSession);
      setRole(getUserRole(updatedSession.job_title)); // Tính toán lại vai trò
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

  // Giá trị cung cấp cho toàn bộ ứng dụng
  const value = {
    user,
    // THAY ĐỔI 4: CUNG CẤP `role` RA BÊN NGOÀI CONTEXT
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

export function useAuth() {
  return useContext(AuthContext);
}
