// src/services/api/authAPI.js
import axiosInstance from "../../utils/axios_instance";
import URL from "../../utils/url";

const ODOO_DB = process.env.REACT_APP_ODOO_DATABASE;

/**
 * Gửi yêu cầu đăng nhập đến Odoo.
 * Kết hợp logic từ cả hai file.
 */
export const login = async (login, password) => {
  // Odoo yêu cầu cấu trúc params lồng nhau cho các lời gọi 'call'
  const params = {
    db: ODOO_DB,
    login: login,
    password: password,
  };
  try {
    const response = await axiosInstance.post(URL.AUTH_LOGIN, {
      jsonrpc: "2.0",
      // Endpoint /web/session/authenticate yêu cầu method 'call' và params lồng nhau
      method: "call",
      params: params,
    });

    if (response.data.error) {
      throw new Error(
        response.data.error.data.message || "Sai tên đăng nhập hoặc mật khẩu."
      );
    }
    return response.data.result;
  } catch (error) {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error.data.message);
    }
    if (error.code === "ERR_NETWORK") {
      throw new Error(
        "Lỗi mạng hoặc CORS. Vui lòng kiểm tra kết nối và cấu hình server."
      );
    }
    throw new Error(
      error.message || "Đã xảy ra lỗi không mong muốn khi đăng nhập."
    );
  }
};

/**
 * Gửi yêu cầu đăng ký tài khoản mới.
 */
export const registerUser = async (signupData) => {
  const params = {
    db: ODOO_DB,
    name: signupData.name,
    login: signupData.email,
    password: signupData.password,
  };
  try {
    const response = await axiosInstance.post(URL.API_SIGNUP, {
      // Giả định URL.API_SIGNUP là endpoint đăng ký của bạn
      jsonrpc: "2.0",
      method: "call",
      params: params,
    });

    if (response.data.error) {
      const errorMessage =
        response.data.error.data?.message || "Đã có lỗi xảy ra khi đăng ký.";
      throw new Error(errorMessage);
    }
    return response.data.result;
  } catch (error) {
    throw new Error(error.message || "Không thể kết nối đến máy chủ.");
  }
};

/**
 * Lấy thông tin session của người dùng hiện tại.
 */
export const getSessionInfo = async () => {
  try {
    const response = await axiosInstance.post("/web/session/get_session_info", {
      jsonrpc: "2.0",
      method: "call",
      params: {}, // Endpoint này cần params rỗng
    });
    if (response.data.error) throw new Error(response.data.error.data.message);
    return response.data.result;
  } catch (error) {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error.data.message);
    }
    if (error.code === "ERR_NETWORK") {
      throw new Error("Mất kết nối đến server.");
    }
    throw new Error(error.message || "Không thể lấy thông tin session.");
  }
};

/**
 * Hủy session trên server Odoo.
 */
export const logout = async () => {
  try {
    await axiosInstance.post("/web/session/destroy", {
      jsonrpc: "2.0",
      method: "call",
      params: {},
    });
    return true;
  } catch (error) {
    console.error("Lỗi khi hủy session phía server:", error);
    // Vẫn trả về true để client có thể tiếp tục quá trình logout
    return true;
  }
};
