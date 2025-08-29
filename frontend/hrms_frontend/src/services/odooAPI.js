import axiosInstance from "../util/axios_instance";
import URL from "../util/url";

// Cấu hình tên database của bạn
const ODOO_DB = process.env.REACT_APP_ODOO_DATABASE;

// /**
//  * Tiện ích chuyển đổi file sang chuỗi Base64 để gửi qua JSON-RPC.
//  * @param {File} file - Đối tượng file từ input.
//  * @returns {Promise<string>} - Một chuỗi Base64.
//  */
// const fileToBase64 = (file) =>
//   new Promise((resolve, reject) => {
//     const reader = new FileReader();
//     reader.readAsDataURL(file);
//     reader.onload = () => resolve(reader.result.split(",")[1]); // Chỉ lấy phần data base64
//     reader.onerror = (error) => reject(error);
//   });

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
    if (error.response && error.response.data && error.response.data.error) {
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
 * Gửi yêu cầu đăng ký người dùng mới (Signup).
 */
export const register = async (userData) => {
  const params = {
    db: ODOO_DB,
    name: userData.name,
    login: userData.email, // Odoo dùng `login` cho email
    password: userData.password,
  };
  try {
    const response = await axiosInstance.post(URL.AUTH_SIGNUP, {
      jsonrpc: "2.0",
      params,
    });

    // Axios sẽ tự động ném lỗi cho các status code 4xx, 5xx,
    // nên khối catch sẽ xử lý các lỗi đó.
    // Nếu request thành công (200 OK), chúng ta trả về toàn bộ phần data.

    // THAY ĐỔI DUY NHẤT Ở ĐÂY
    // Trả về toàn bộ object { success, data } để AuthContext xử lý
    return response.data;
  } catch (error) {
    // Ném lỗi ra để AuthContext có thể bắt và hiển thị thông báo chính xác
    throw error;
  }
};

/**
 * Gửi yêu cầu cập nhật thông tin người dùng.
 */
export const updateProfile = async (userId, updateData) => {
  const params = {
    model: "res.users",
    method: "write",
    args: [[userId], updateData],
    kwargs: {},
  };
  try {
    const response = await axiosInstance.post(URL.RPC_CALL, {
      jsonrpc: "2.0",
      params,
    });
    if (response.data.error) {
      throw new Error(
        response.data.error.data.message || "Cập nhật thông tin thất bại."
      );
    }
    return response.data.result;
  } catch (error) {
    if (error.response && error.response.data && error.response.data.error) {
      throw new Error(error.response.data.error.data.message);
    }
    throw new Error(error.message || "Đã xảy ra lỗi khi cập nhật thông tin.");
  }
};

/**
 * Hàm gọi API để lấy danh sách tasks
 */
export const fetchTasks = async () => {
  // Tương tự, việc lấy dữ liệu cũng dùng 'execute_kw' với method 'search_read'
  const params = {
    model: "project.task", // Tên model task của bạn
    method: "search_read",
    args: [[]], // Domain lọc, [] để lấy tất cả
    kwargs: {
      fields: ["id", "name", "stage_id", "user_id", "date_deadline"], // Các trường cần lấy
    },
  };
  try {
    const response = await axiosInstance.post(URL.RPC_CALL, {
      jsonrpc: "2.0",
      params,
    });
    if (response.data.error) {
      throw new Error(
        response.data.error.data.message || "Không thể tải danh sách công việc."
      );
    }
    return response.data.result;
  } catch (error) {
    if (error.response && error.response.data && error.response.data.error) {
      throw new Error(error.response.data.error.data.message);
    }
    throw new Error(error.message || "Đã xảy ra lỗi khi tải công việc.");
  }
};
