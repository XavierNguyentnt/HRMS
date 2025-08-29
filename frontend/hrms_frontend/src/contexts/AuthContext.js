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
      const sessionInfo = await odooApi.login(email, password);
      setUser(sessionInfo);
      localStorage.setItem("userSession", JSON.stringify(sessionInfo));
      return sessionInfo;
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
    // Có thể thêm lệnh gọi API logout ở đây nếu backend yêu cầu
  };

  /**
   * Xử lý đăng ký người dùng mới.
   * @param {object} userData - Dữ liệu người dùng { name, email, password }
   * @returns {boolean} - Trả về true nếu thành công, false nếu thất bại.
   */
  const handleRegister = async (userData) => {
    setIsRegisterLoading(true);
    setRegisterError(null);
    try {
      // odooApi.register trả về { success: true, data: { ... } }
      const response = await odooApi.register(userData);

      // ==========================================================
      // ĐIỂM THAY ĐỔI QUAN TRỌNG NHẤT
      // Chúng ta chỉ lấy phần 'data' từ response để cập nhật user state
      const newSession = response.data;

      setUser(newSession);
      localStorage.setItem("userSession", JSON.stringify(newSession));
      // ==========================================================

      return true; // Báo hiệu đăng ký thành công để trang Register có thể điều hướng
    } catch (err) {
      // Axios sẽ tự động ném lỗi cho các status 4xx, 5xx
      // Lấy message lỗi từ response của Odoo
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

  /**
   * Cập nhật thông tin người dùng.
   * @param {FormData} updateData - Dữ liệu form chứa thông tin cần cập nhật.
   * @returns {boolean} - Trả về true nếu thành công, false nếu thất bại.
   */
  const handleUpdateProfile = async (updateData) => {
    setIsUpdateLoading(true);
    setUpdateError(null);
    setUpdateSuccess(false);
    try {
      // API cập nhật nên trả về thông tin user đã được làm mới
      const updatedUserFields = await odooApi.updateProfile(
        user.uid,
        updateData
      );

      // Cập nhật state toàn cục với thông tin mới
      const updatedSession = { ...user, ...updatedUserFields };
      setUser(updatedSession);
      localStorage.setItem("userSession", JSON.stringify(updatedSession));

      setUpdateSuccess(true); // Set trạng thái thành công để hiển thị thông báo
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

    // Props cho Login
    isLoading: isLoginLoading, // Giữ lại `isLoading` để tương thích với LoginPage cũ
    error: loginError, // Giữ lại `error`
    handleLogin,

    // Props cho Register
    isRegisterLoading,
    registerError,
    handleRegister,

    // Props cho Profile Update
    isUpdateLoading,
    updateError,
    updateSuccess,
    handleUpdateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
