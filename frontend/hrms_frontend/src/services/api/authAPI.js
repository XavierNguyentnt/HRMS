// src/services/api/authAPI.js
import axiosInstance from "../../util/axios_instance";
import URL from "../../util/url";

const ODOO_DB = process.env.REACT_APP_ODOO_DATABASE;

/**
 * Hàm gọi API để đăng nhập vào Odoo.
 */
export const login = async (login, password) => {
  const params = { db: ODOO_DB, login, password };
  try {
    const response = await axiosInstance.post(URL.AUTH_LOGIN, {
      jsonrpc: "2.0",
      params,
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
 * Lấy thông tin session của người dùng hiện tại.
 */
export const getSessionInfo = async () => {
  const params = {};
  const response = await axiosInstance.post("/web/session/get_session_info", {
    jsonrpc: "2.0",
    params,
  });
  if (response.data.error) throw new Error(response.data.error.data.message);
  return response.data.result;
};
