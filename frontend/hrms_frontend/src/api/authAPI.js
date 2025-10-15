// src/api/authAPI.js
import axiosInstance from "../utils/axios_instance";
import URL from "../utils/url";

const ODOO_DB = process.env.REACT_APP_ODOO_DATABASE;

/**
 * Gửi yêu cầu đăng nhập đến Odoo.
 */
export const loginUser = async (identifier, password) => {
  try {
    const response = await axiosInstance.post(URL.API_LOGIN, {
      jsonrpc: "2.0",
      method: "call", // 🔥 BẮT BUỘC
      params: {
        db: ODOO_DB,
        login: identifier,
        password: password,
      },
    });

    if (response.data.error) {
      throw new Error(response.data.error.data.message || "Đăng nhập thất bại");
    }

    return response.data.result; // uid, user_context, db...
  } catch (err) {
    throw new Error(err.message || "Không thể kết nối Odoo.");
  }
};

/**
 * Gửi yêu cầu đăng ký tài khoản mới.
 */
export const registerUser = async (signupData) => {
  try {
    const response = await axiosInstance.post(URL.API_SIGNUP, {
      jsonrpc: "2.0",
      method: "call",
      params: {
        db: ODOO_DB,
        name: signupData.name,
        login: signupData.email,
        password: signupData.password,
      },
    });

    if (response.data.error) {
      // Lấy message từ backend (nếu có)
      const errorMessage =
        response.data.error.data?.message ||
        response.data.error.data?.details ||
        "Đã có lỗi xảy ra.";
      return { success: false, error: errorMessage };
    }

    // Trường hợp thành công → bạn có thể để backend trả { success: true }
    return { success: true, ...response.data.result };
  } catch (err) {
    return { success: false, error: err.message || "Không thể đăng ký." };
  }
};
