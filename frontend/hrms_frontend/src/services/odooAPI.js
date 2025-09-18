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
  "resume_line_ids",
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
      limit: 1,
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
 * HÀM MỚI: Lấy thông tin chi tiết của một nhân viên bằng ID của chính nhân viên đó (hr.employee).
 * Hiệu quả hơn search_read khi đã biết ID.
 * @param {number} employeeId - ID của nhân viên (hr.employee)
 * @returns {Promise<object>} - Dữ liệu chi tiết của nhân viên.
 */
export const fetchEmployeeById = async (employeeId) => {
  const params = {
    model: "hr.employee",
    method: "read", // Sử dụng 'read' để lấy trực tiếp từ ID
    args: [
      [employeeId], // Odoo 'read' cần một mảng chứa các ID
      PROFILE_FIELDS, // Tái sử dụng danh sách các trường đã định nghĩa
    ],
    kwargs: { context: { lang: "vi_VN" } },
  };
  try {
    const response = await axiosInstance.post(URL.RPC_CALL, {
      jsonrpc: "2.0",
      params,
    });
    if (response.data.error) {
      throw new Error(
        response.data.error.data.message || "Không thể tải thông tin nhân viên."
      );
    }
    // 'read' trả về một mảng các record, ta chỉ cần record đầu tiên
    if (response.data.result && response.data.result.length > 0) {
      return response.data.result[0];
    }
    throw new Error("Không tìm thấy nhân viên với ID đã cho.");
  } catch (error) {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error.data.message);
    }
    throw new Error(error.message || "Lỗi khi tải hồ sơ nhân viên.");
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
    kwargs: { context: { lang: "vi_VN" } },
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

// === CÁC HÀM API MỚI CHO VIỆC THÊM/XÓA KỸ NĂNG ===

/**
 * Lấy tất cả các loại kỹ năng (vd: Language, Programming).
 */
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
  return response.data.result || []; // SỬA LỖI: Đảm bảo luôn trả về một mảng
};

/**
 * HÀM API MỚI VÀ DUY NHẤT ĐỂ LẤY CẤP ĐỘ
 * Lấy danh sách các cấp độ hợp lệ, bao gồm cả cấp độ chung (theo loại) và cấp độ riêng (theo kỹ năng).
 * @param {number} typeId - ID của Loại kỹ năng đang được chọn.
 * @param {number} skillId - ID của Tên kỹ năng đang được chọn.
 */

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
  return response.data.result || []; // SỬA LỖI: Đảm bảo luôn trả về một mảng
};

/**
 * Lấy tất cả các cấp độ thuộc một LOẠI kỹ năng.
 * Đây là logic đúng dựa trên dữ liệu và view của Odoo.
 */
export const fetchSkillLevelsByType = async (typeId) => {
  const params = {
    model: "hr.skill.level",
    method: "search_read",
    args: [[["skill_type_id", "=", typeId]]], // Lọc theo skill_type_id
    kwargs: { fields: ["id", "name"] },
  };
  const response = await axiosInstance.post(URL.RPC_CALL, {
    jsonrpc: "2.0",
    params,
  });
  return response.data.result || [];
};

/**
 * Lấy các cấp độ được phép DỰA TRÊN TÊN KỸ NĂNG cụ thể.
 * Đây là logic bắt buộc phải tuân theo constraint của server Odoo.
 */
export const fetchSkillLevelsBySkill = async (skillId) => {
  const params = {
    model: "hr.skill.level",
    method: "search_read",
    args: [[["skill_id", "=", skillId]]], // Lọc theo skill_id
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
    kwargs: {},
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
    kwargs: {},
  };
  const response = await axiosInstance.post(URL.RPC_CALL, {
    jsonrpc: "2.0",
    params,
  });
  if (response.data.error) throw new Error(response.data.error.data.message);
  return response.data.result;
};

/**
 * THÊM HÀM MỚI
 * Cập nhật một dòng kỹ năng đã có của nhân viên (chủ yếu là cập nhật skill_level_id).
 */
export const updateEmployeeSkill = async (skillLineId, data) => {
  const params = {
    model: "hr.employee.skill",
    method: "write",
    args: [[skillLineId], data], // data sẽ là { skill_level_id: newLevelId }
    kwargs: {},
  };
  const response = await axiosInstance.post(URL.RPC_CALL, {
    jsonrpc: "2.0",
    params,
  });
  if (response.data.error) throw new Error(response.data.error.data.message);
  return response.data.result;
};

// === CÁC HÀM API CHO VIỆC THÊM/XÓA KINH NGHIỆM LÀM VIỆC ===

/**
 * Lấy chi tiết các dòng kinh nghiệm làm việc (resume).
 */
export const fetchEmployeeResumeLines = async (resume_line_ids) => {
  if (!resume_line_ids || resume_line_ids.length === 0) return [];
  const params = {
    model: "hr.resume.line",
    method: "read",
    args: [
      resume_line_ids,
      ["id", "name", "date_start", "date_end", "description", "line_type_id"],
    ],
    kwargs: {},
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
    kwargs: {},
  };
  const response = await axiosInstance.post(URL.RPC_CALL, {
    jsonrpc: "2.0",
    params,
  });
  if (response.data.error) throw new Error(response.data.error.data.message);
  return response.data.result;
};

/**
 * Thêm 1 dòng kinh nghiệm (hr.resume.line)
 * @param {Object} resumeData - { employee_id, name, date_start, date_end, description, line_type_id, ... }
 * @returns {number} id của record mới tạo (theo response Odoo)
 */
export const addResumeLine = async (resumeData) => {
  const params = {
    model: "hr.resume.line",
    method: "create",
    args: [resumeData],
    kwargs: {},
  };
  try {
    const response = await axiosInstance.post(URL.RPC_CALL, {
      jsonrpc: "2.0",
      params,
    });
    if (response.data.error) {
      throw new Error(response.data.error.data.message);
    }
    return response.data.result;
  } catch (error) {
    console.error("Lỗi khi thêm resume line:", error);
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error.data.message);
    }
    throw new Error(error.message || "Đã xảy ra lỗi khi thêm resume.");
  }
};

/**
 * Cập nhật 1 dòng kinh nghiệm theo id
 * @param {number} resumeLineId
 * @param {Object} data - các trường cần cập nhật, ví dụ { name, date_start, date_end, description }
 * @returns {boolean} true nếu cập nhật thành công
 */
export const updateResumeLine = async (resumeLineId, data) => {
  const params = {
    model: "hr.resume.line",
    method: "write",
    args: [[resumeLineId], data],
    kwargs: {},
  };
  try {
    const response = await axiosInstance.post(URL.RPC_CALL, {
      jsonrpc: "2.0",
      params,
    });
    if (response.data.error) {
      throw new Error(response.data.error.data.message);
    }
    return response.data.result;
  } catch (error) {
    console.error("Lỗi khi cập nhật resume line:", error);
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error.data.message);
    }
    throw new Error(error.message || "Đã xảy ra lỗi khi cập nhật resume.");
  }
};

// Lấy danh sách quốc gia
export const fetchCountries = async () => {
  const params = {
    model: "res.country",
    method: "search_read",
    args: [[], ["id", "name"]],
    kwargs: { order: "name asc" },
  };
  const response = await axiosInstance.post(URL.RPC_CALL, {
    jsonrpc: "2.0",
    params,
  });
  if (response.data.error) throw new Error(response.data.error.data.message);
  return response.data.result;
};

// Lấy danh sách tỉnh/thành theo country
export const fetchStatesByCountry = async (countryId) => {
  const params = {
    model: "res.country.state",
    method: "search_read",
    args: [[["country_id", "=", countryId]], ["id", "name"]],
    kwargs: { order: "name asc" },
  };
  const response = await axiosInstance.post(URL.RPC_CALL, {
    jsonrpc: "2.0",
    params,
  });
  if (response.data.error) throw new Error(response.data.error.data.message);
  return response.data.result;
};

// === CÁC HÀM API MỚI CHO TRANG PHÒNG BAN & NHÂN VIÊN ===

/**
 * Lấy danh sách tất cả các phòng ban.
 */
export const fetchDepartments = async () => {
  const params = {
    model: "hr.department",
    method: "search_read",
    args: [[]],
    kwargs: {
      // Lấy thêm các trường từ XML bạn cung cấp
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
 * @param {Array} domain - Mảng điều kiện lọc của Odoo, vd: [['department_id', '=', 1]]
 * @param {Array} fields - Mảng các trường cần lấy, vd: ['name', 'job_title']
 * @param {number} limit - Số lượng bản ghi tối đa
 * @param {number} offset - Vị trí bắt đầu lấy
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

/**
 * [ADMIN] Tạo một bản ghi nhân viên mới.
 * @param {object} employeeData - Dữ liệu của nhân viên mới (vd: { name, work_email, ... })
 */
export const createEmployee = async (employeeData) => {
  const params = {
    model: "hr.employee",
    method: "create",
    args: [employeeData],
    kwargs: {},
  };
  const response = await axiosInstance.post(URL.RPC_CALL, {
    jsonrpc: "2.0",
    params,
  });
  if (response.data.error) throw new Error(response.data.error.data.message);
  return response.data.result; // Trả về ID của nhân viên mới
};

/**
 * [ADMIN] Vô hiệu hóa một nhân viên (an toàn hơn xóa).
 * @param {number} employeeId - ID của nhân viên cần vô hiệu hóa.
 */
export const archiveEmployee = async (employeeId) => {
  const params = {
    model: "hr.employee",
    method: "write",
    args: [[employeeId], { active: false }], // Đặt trường active thành false
    kwargs: {},
  };
  const response = await axiosInstance.post(URL.RPC_CALL, {
    jsonrpc: "2.0",
    params,
  });
  if (response.data.error) throw new Error(response.data.error.data.message);
  return response.data.result; // Trả về true
};

/**
 * Gửi yêu cầu đăng ký tài khoản mới.
 * @param {object} signupData - Dữ liệu đăng ký { name, email, password }
 */
export const registerUser = async (signupData) => {
  const params = {
    ...signupData,
  };
  // Giả sử URL.API_SIGNUP = '/api/signup'
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
