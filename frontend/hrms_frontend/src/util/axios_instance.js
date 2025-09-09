import axios from "axios";

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
  withCredentials: true,
});

// Tạo một Request Interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Kiểm tra xem đây có phải là một lệnh gọi RPC tới Odoo không
    if (config.data && config.data.params && config.data.params.kwargs) {
      // Tự động thêm context ngôn ngữ vào kwargs
      config.data.params.kwargs.context = {
        ...config.data.params.kwargs.context,
        lang: "vi_VN",
      };
    }
    return config; // Trả về config đã được chỉnh sửa để request tiếp tục
  },
  (error) => {
    // Xử lý lỗi nếu có
    return Promise.reject(error);
  }
);

export default axiosInstance;
