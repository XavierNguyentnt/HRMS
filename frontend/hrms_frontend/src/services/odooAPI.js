import axiosInstance from "../util/axios_instance";
import URL from "../util/url";

// Cấu hình tên database của bạn
const ODOO_DB = process.env.REACT_APP_ODOO_DATABASE;

// =================================================================
// === CÁC HÀM XÁC THỰC & CƠ BẢN =================================
// =================================================================

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
 * Gửi yêu cầu đăng ký người dùng mới (Signup).
 */
export const register = async (userData) => {
  const params = {
    db: ODOO_DB,
    name: userData.name,
    login: userData.email,
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

// =================================================================
// === CÁC HÀM API MỚI CHO HỒ SƠ NHÂN VIÊN (EMPLOYEE PROFILE) ======
// =================================================================

/**
 * MỚI: Lấy thông tin chi tiết và quyền của một nhân viên theo ID.
 * Hàm này sẽ gọi đến controller tùy chỉnh của chúng ta ở backend.
 * @param {number} employeeId - ID của nhân viên (hr.employee)
 * @returns {Promise<object>} - Object chứa { profile: {...}, permissions: {...} }
 */
export const fetchEmployeeById = async (employeeId) => {
  try {
    const response = await axiosInstance.get(`/v1/employees/${employeeId}`);
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi tải hồ sơ nhân viên ID ${employeeId}:`, error);
    if (error.response) {
      throw new Error(error.response.data.message || `Không thể tải hồ sơ.`);
    }
    throw new Error("Lỗi mạng hoặc server không phản hồi.");
  }
};

/**
 * SỬA ĐỔI: Gửi yêu cầu cập nhật thông tin nhân viên qua controller mới.
 * @param {number} employeeId - ID của nhân viên (hr.employee)
 * @param {object} updateData - Các trường dữ liệu cần cập nhật
 */
export const updateProfile = async (employeeId, updateData) => {
  try {
    // Gọi đến API PUT của controller tùy chỉnh
    const response = await axiosInstance.put(`/v1/employees/${employeeId}`, {
      jsonrpc: "2.0",
      params: updateData,
    });
    if (response.data.error) {
      throw new Error(response.data.error.data.message || "Cập nhật thất bại.");
    }
    return response.data.result;
  } catch (error) {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error.data.message);
    }
    throw new Error(error.message || "Đã xảy ra lỗi khi cập nhật.");
  }
};

/**
 * MỚI: Gửi yêu cầu vô hiệu hóa (xóa mềm) một nhân viên.
 * @param {number} employeeId - ID của nhân viên (hr.employee)
 */
export const deactivateEmployee = async (employeeId) => {
  try {
    // Gọi đến API DELETE của controller tùy chỉnh
    const response = await axiosInstance.delete(`/v1/employees/${employeeId}`);
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi vô hiệu hóa nhân viên ID ${employeeId}:`, error);
    if (error.response) {
      throw new Error(error.response.data.message || `Không thể vô hiệu hóa.`);
    }
    throw new Error("Lỗi mạng hoặc server không phản hồi.");
  }
};

// =================================================================
// === CÁC HÀM API CHO PHÒNG BAN & DANH SÁCH NHÂN VIÊN ============
// =================================================================

/**
 * Lấy danh sách tất cả các phòng ban.
 */
export const fetchDepartments = async () => {
  const params = {
    model: "hr.department",
    method: "search_read",
    args: [[]],
    kwargs: {
      fields: [
        "id",
        "name",
        "manager_id",
        "total_employee",
        "color",
        "company_id",
      ],
      context: { lang: "vi_VN" },
    },
  };
  const response = await axiosInstance.post(URL.RPC_CALL, {
    jsonrpc: "2.0",
    params,
  });
  if (response.data.error) throw new Error(response.data.error.data.message);
  return response.data.result || [];
};

/**
 * Lấy danh sách nhân viên với các tùy chọn linh hoạt.
 */
export const fetchEmployees = async ({
  domain = [],
  fields = [],
  limit = 80,
  offset = 0,
}) => {
  const params = {
    model: "hr.employee",
    method: "search_read",
    args: [domain],
    kwargs: {
      fields:
        fields.length > 0
          ? fields
          : [
              "id",
              "name",
              "job_title",
              "work_email",
              "work_phone",
              "image_128",
            ],
      limit,
      offset,
      context: { lang: "vi_VN" },
    },
  };
  const response = await axiosInstance.post(URL.RPC_CALL, {
    jsonrpc: "2.0",
    params,
  });
  if (response.data.error) throw new Error(response.data.error.data.message);
  return response.data.result || [];
};

// =================================================================
// === CÁC HÀM API TIỆN ÍCH KHÁC (KỸ NĂNG, KINH NGHIỆM,...) ========
// =================================================================

/**
 * Lấy thông tin chi tiết của nhân viên (employee profile) từ user_id.
 * HỮU ÍCH: Dùng để lấy hồ sơ của chính người dùng đang đăng nhập trong AuthContext.
 * @param {number} userId - ID của user (res.users)
 */
export const fetchUserProfile = async (userId) => {
  const PROFILE_FIELDS = [
    "id",
    "name",
    "job_title",
    "user_id",
    "employee_skill_ids",
    "resume_line_ids" /* ...Thêm các trường cần thiết cho user context... */,
  ];
  const params = {
    model: "hr.employee",
    method: "search_read",
    args: [[["user_id", "=", userId]]],
    kwargs: { fields: PROFILE_FIELDS, limit: 1 },
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
      return response.data.result[0];
    }
    return {};
  } catch (error) {
    throw new Error(error.message || "Lỗi khi tải hồ sơ người dùng.");
  }
};

export const fetchEmployeeSkills = async (skill_ids) => {
  if (!skill_ids || skill_ids.length === 0) return [];
  const params = {
    model: "hr.employee.skill",
    method: "read",
    args: [
      skill_ids,
      ["id", "skill_id", "skill_level_id", "skill_type_id", "level_progress"],
    ],
  };
  const response = await axiosInstance.post(URL.RPC_CALL, {
    jsonrpc: "2.0",
    params,
  });
  if (response.data.error) throw new Error(response.data.error.data.message);
  return response.data.result;
};

export const fetchEmployeeResumeLines = async (resume_line_ids) => {
  if (!resume_line_ids || resume_line_ids.length === 0) return [];
  const params = {
    model: "hr.resume.line",
    method: "read",
    args: [
      resume_line_ids,
      ["id", "name", "date_start", "date_end", "description"],
    ],
  };
  const response = await axiosInstance.post(URL.RPC_CALL, {
    jsonrpc: "2.0",
    params,
  });
  if (response.data.error) throw new Error(response.data.error.data.message);
  return response.data.result;
};

export const fetchSkillTypes = async () => {
  const params = {
    model: "hr.skill.type",
    method: "search_read",
    args: [[]],
    kwargs: { fields: ["id", "name"] },
  };
  const response = await axiosInstance.post(URL.RPC_CALL, {
    jsonrpc: "2.0",
    params,
  });
  return response.data.result || [];
};

export const fetchSkillsByType = async (typeId) => {
  const params = {
    model: "hr.skill",
    method: "search_read",
    args: [[["skill_type_id", "=", typeId]]],
    kwargs: { fields: ["id", "name"] },
  };
  const response = await axiosInstance.post(URL.RPC_CALL, {
    jsonrpc: "2.0",
    params,
  });
  return response.data.result || [];
};

export const fetchSkillLevelsByType = async (typeId) => {
  const params = {
    model: "hr.skill.level",
    method: "search_read",
    args: [[["skill_type_id", "=", typeId]]],
    kwargs: { fields: ["id", "name"] },
  };
  const response = await axiosInstance.post(URL.RPC_CALL, {
    jsonrpc: "2.0",
    params,
  });
  return response.data.result || [];
};

export const addEmployeeSkill = async (skillData) => {
  const params = {
    model: "hr.employee.skill",
    method: "create",
    args: [skillData],
  };
  const response = await axiosInstance.post(URL.RPC_CALL, {
    jsonrpc: "2.0",
    params,
  });
  if (response.data.error) throw new Error(response.data.error.data.message);
  return response.data.result;
};

export const updateEmployeeSkill = async (skillLineId, data) => {
  const params = {
    model: "hr.employee.skill",
    method: "write",
    args: [[skillLineId], data],
  };
  const response = await axiosInstance.post(URL.RPC_CALL, {
    jsonrpc: "2.0",
    params,
  });
  if (response.data.error) throw new Error(response.data.error.data.message);
  return response.data.result;
};

export const deleteEmployeeSkill = async (skillLineId) => {
  const params = {
    model: "hr.employee.skill",
    method: "unlink",
    args: [[skillLineId]],
  };
  const response = await axiosInstance.post(URL.RPC_CALL, {
    jsonrpc: "2.0",
    params,
  });
  if (response.data.error) throw new Error(response.data.error.data.message);
  return response.data.result;
};

export const addResumeLine = async (resumeData) => {
  const params = {
    model: "hr.resume.line",
    method: "create",
    args: [resumeData],
  };
  const response = await axiosInstance.post(URL.RPC_CALL, {
    jsonrpc: "2.0",
    params,
  });
  if (response.data.error) throw new Error(response.data.error.data.message);
  return response.data.result;
};

export const updateResumeLine = async (resumeLineId, data) => {
  const params = {
    model: "hr.resume.line",
    method: "write",
    args: [[resumeLineId], data],
  };
  const response = await axiosInstance.post(URL.RPC_CALL, {
    jsonrpc: "2.0",
    params,
  });
  if (response.data.error) throw new Error(response.data.error.data.message);
  return response.data.result;
};

export const deleteResumeLine = async (resumeLineId) => {
  const params = {
    model: "hr.resume.line",
    method: "unlink",
    args: [[resumeLineId]],
  };
  const response = await axiosInstance.post(URL.RPC_CALL, {
    jsonrpc: "2.0",
    params,
  });
  if (response.data.error) throw new Error(response.data.error.data.message);
  return response.data.result;
};

export const fetchCountries = async () => {
  const params = {
    model: "res.country",
    method: "search_read",
    args: [[]],
    kwargs: { fields: ["id", "name"], order: "name asc" },
  };
  const response = await axiosInstance.post(URL.RPC_CALL, {
    jsonrpc: "2.o",
    params,
  });
  if (response.data.error) throw new Error(response.data.error.data.message);
  return response.data.result;
};

export const fetchStatesByCountry = async (countryId) => {
  const params = {
    model: "res.country.state",
    method: "search_read",
    args: [[["country_id", "=", countryId]]],
    kwargs: { fields: ["id", "name"], order: "name asc" },
  };
  const response = await axiosInstance.post(URL.RPC_CALL, {
    jsonrpc: "2.0",
    params,
  });
  if (response.data.error) throw new Error(response.data.error.data.message);
  return response.data.result;
};
