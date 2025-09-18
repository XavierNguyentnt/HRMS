// src/api/authAPI.js

import axiosInstance from "../util/axios_instance";
import URL from "../util/url";

const ODOO_DB = process.env.REACT_APP_ODOO_DATABASE;

/**
 * Gửi yêu cầu đăng nhập đến Odoo.
 * @param {string} identifier - Email hoặc login của người dùng
 * @param {string} password - Mật khẩu
 */
export const loginUser = async (identifier, password) => {
  const params = {
    db: ODOO_DB,
    login: identifier,
    password: password,
  };
  const response = await axiosInstance.post(URL.API_LOGIN, {
    jsonrpc: "2.0",
    params,
  });

  // Nếu Odoo trả về lỗi, ném ra một Error để AuthContext có thể bắt được
  if (response.data.error) {
    throw new Error(response.data.error.data.message || "Đăng nhập thất bại");
  }

  // Trả về dữ liệu session nếu thành công
  return response.data.result;
};

/**
 * Gửi yêu cầu đăng ký tài khoản mới.
 * @param {object} signupData - Dữ liệu đăng ký { name, email, password }
 */
export const registerUser = async (signupData) => {
  const params = {
    ...signupData,
  };
  const response = await axiosInstance.post(URL.API_SIGNUP, {
    jsonrpc: "2.0",
    params,
  });

  // Xử lý lỗi trả về từ controller
  if (response.data.error) {
    throw new Error(response.data.error.data.details || "Đã có lỗi xảy ra.");
  }

  return response.data.result;
};
