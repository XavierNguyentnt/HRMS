import axiosInstance from "../util/axios_instance";
import URL from "../util/url";

// Cấu hình tên database của bạn
const ODOO_DB = process.env.REACT_APP_ODOO_DATABASE;

/**
 * Danh sách các trường cần lấy từ model hr.employee để hiển thị đầy đủ trên trang Profile.
 * Dựa trên XML view của Odoo.
 */
const PROFILE_FIELDS = [
  "name",
  "job_title",
  "mobile_phone",
  "work_phone",
  "work_email",
  "work_location_id",
  "parent_id", // SỬA LỖI: Đổi 'employee_parent_id' thành 'parent_id'
  "coach_id",
  "department_id",
  "address_id",
  "private_street",
  "private_street2",
  "private_city",
  "private_state_id",
  "private_zip",
  "private_country_id",
  "private_email",
  "private_phone",
  // "private_lang",
  // "employee_bank_account_id",
  "distance_home_work",
  "country_id",
  "identification_id",
  "ssnid",
  "passport_id",
  "gender",
  "birthday",
  "place_of_birth",
  "country_of_birth",
  "marital",
  "spouse_complete_name",
  "spouse_birthdate",
  "certificate",
  "study_field",
  "study_school",
  "children",
  "emergency_contact",
  "emergency_phone",
  "visa_no",
  "permit_no",
  "visa_expire",
  "employee_type",
  "pin",
  "barcode",
  "image_1920",
  "employee_skill_ids",
  // "can_edit", // Trường quan trọng để kiểm soát quyền sửa
];

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
 * Lấy thông tin chi tiết của nhân viên (employee profile) từ user_id.
 * @param {number} userId - ID của user (res.users)
 * @returns {Promise<object>} - Dữ liệu chi tiết của nhân viên (hr.employee)
 */
export const fetchUserProfile = async (userId) => {
  const params = {
    model: "hr.employee",
    method: "search_read",
    args: [[["user_id", "=", userId]]], // Domain để tìm nhân viên liên kết với user
    kwargs: {
      fields: PROFILE_FIELDS,
      limit: 1, // Chỉ cần 1 kết quả
    },
  };
  try {
    const response = await axiosInstance.post(URL.RPC_CALL, {
      jsonrpc: "2.0",
      params,
    });
    if (response.data.error) {
      throw new Error(
        response.data.error.data.message || "Không thể tải thông tin hồ sơ."
      );
    }
    if (response.data.result && response.data.result.length > 0) {
      return response.data.result[0]; // Trả về đối tượng nhân viên đầu tiên tìm thấy
    }
    console.warn(
      "Không tìm thấy hồ sơ nhân viên (hr.employee) cho người dùng này."
    );
    return {}; // Trả về object rỗng nếu không có
  } catch (error) {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error.data.message);
    }
    throw new Error(error.message || "Lỗi khi tải hồ sơ người dùng.");
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
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Gửi yêu cầu cập nhật thông tin nhân viên.
 * @param {number} employeeId - ID của nhân viên (hr.employee)
 * @param {object} updateData - Các trường dữ liệu cần cập nhật
 */
export const updateProfile = async (employeeId, updateData) => {
  // Model phải là 'hr.employee' vì các trường thông tin cá nhân nằm ở đây
  const params = {
    model: "hr.employee",
    method: "write",
    args: [[employeeId], updateData],
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
    return response.data.result; // Odoo 'write' trả về true
  } catch (error) {
    if (error.response && error.response.data && error.response.data.error) {
      throw new Error(error.response.data.error.data.message);
    }
    throw new Error(error.message || "Đã xảy ra lỗi khi cập nhật thông tin.");
  }
};

/**
 * THÊM HÀM MỚI
 * Lấy thông tin chi tiết các kỹ năng của nhân viên từ danh sách ID.
 * @param {number[]} skill_ids - Mảng chứa các ID của hr.employee.skill
 * @returns {Promise<Array>} - Mảng các đối tượng kỹ năng chi tiết
 */
export const fetchEmployeeSkills = async (skill_ids) => {
  if (!skill_ids || skill_ids.length === 0) {
    return []; // Trả về mảng rỗng nếu không có ID nào
  }
  const params = {
    model: "hr.employee.skill", // Model chứa thông tin chi tiết kỹ năng
    method: "read", // Dùng 'read' để lấy chi tiết từ ID
    args: [
      skill_ids,
      ["id", "skill_id", "skill_level_id", "skill_type_id", "level_progress"], // Các trường cần lấy
    ],
    kwargs: {},
  };
  try {
    const response = await axiosInstance.post(URL.RPC_CALL, {
      jsonrpc: "2.0",
      params,
    });
    if (response.data.error) {
      throw new Error(
        response.data.error.data.message || "Không thể tải danh sách kỹ năng."
      );
    }
    return response.data.result;
  } catch (error) {
    console.error("Lỗi khi tải kỹ năng nhân viên:", error);
    throw error;
  }
};
