// import axiosInstance from "../util/axios_instance";
// import URL from "../util/url";

// axiosInstance.defaults.withCredentials = true;

// // Cấu hình tên database của bạn
// const ODOO_DB = process.env.REACT_APP_ODOO_DATABASE;
// /*==========================*/
// /*CÁC API QUẢN TRỊ NGƯỜI DÙNG*/
// /*===========================*/
// /**
//  * Danh sách các trường cần lấy từ model hr.employee để hiển thị đầy đủ trên trang Profile.
//  * Dựa trên XML view của Odoo.
//  */
// const PROFILE_FIELDS = [
//   "name",
//   "job_title",
//   "mobile_phone",
//   "work_phone",
//   "work_email",
//   "work_location_id",
//   "parent_id", // SỬA LỖI: Đổi 'employee_parent_id' thành 'parent_id'
//   "coach_id",
//   // "partner_id",
//   "department_id",
//   "address_id",
//   "private_street",
//   "private_street2",
//   "private_city",
//   "private_state_id",
//   "private_zip",
//   "private_country_id",
//   "private_email",
//   "private_phone",
//   // "private_lang",
//   // "employee_bank_account_id",
//   "distance_home_work",
//   "country_id",
//   "identification_id",
//   "ssnid",
//   "passport_id",
//   "gender",
//   "birthday",
//   "place_of_birth",
//   "country_of_birth",
//   "marital",
//   "spouse_complete_name",
//   "spouse_birthdate",
//   "certificate",
//   "study_field",
//   "study_school",
//   "children",
//   "emergency_contact",
//   "emergency_phone",
//   "visa_no",
//   "permit_no",
//   "visa_expire",
//   "employee_type",
//   "pin",
//   "barcode",
//   "image_1920",
//   "employee_skill_ids",
//   "resume_line_ids",
//   // "can_edit", // Trường quan trọng để kiểm soát quyền sửa
// ];

// /**
//  * Hàm gọi API để đăng nhập vào Odoo.
//  */
// export const login = async (login, password) => {
//   const params = { db: ODOO_DB, login, password };
//   try {
//     const response = await axiosInstance.post(URL.AUTH_LOGIN, {
//       jsonrpc: "2.0",
//       params,
//     });
//     if (response.data.error) {
//       throw new Error(
//         response.data.error.data.message || "Sai tên đăng nhập hoặc mật khẩu."
//       );
//     }
//     return response.data.result;
//   } catch (error) {
//     if (error.response && error.response.data && error.response.data.error) {
//       throw new Error(error.response.data.error.data.message);
//     }
//     if (error.code === "ERR_NETWORK") {
//       throw new Error(
//         "Lỗi mạng hoặc CORS. Vui lòng kiểm tra kết nối và cấu hình server."
//       );
//     }
//     throw new Error(
//       error.message || "Đã xảy ra lỗi không mong muốn khi đăng nhập."
//     );
//   }
// };

// /*Lấy thông tin người dùng hiện tại (res.users) */
// export const fetchUsers = async () => {
//   const params = {
//     model: "res.users",
//     method: "search_read",
//     args: [[["share", "=", false]]], // chỉ lấy user nội bộ, loại bỏ portal
//     kwargs: {
//       fields: ["id", "name", "login", "partner_id"],
//       order: "name asc",
//     },
//   };
//   const response = await axiosInstance.post(URL.RPC_CALL, {
//     jsonrpc: "2.0",
//     params,
//   });
//   if (response.data.error) throw new Error(response.data.error.data.message);
//   return response.data.result;
// };

// /**
//  * Lấy thông tin chi tiết của nhân viên (employee profile) từ user_id.
//  * @param {number} userId - ID của user (res.users)
//  * @returns {Promise<object>} - Dữ liệu chi tiết của nhân viên (hr.employee)
//  */
// export const fetchUserProfile = async (userId) => {
//   const params = {
//     model: "hr.employee",
//     method: "search_read",
//     args: [[["user_id", "=", userId]]], // Domain để tìm nhân viên liên kết với user
//     kwargs: {
//       fields: PROFILE_FIELDS,
//       limit: 1,
//     },
//   };
//   try {
//     const response = await axiosInstance.post(URL.RPC_CALL, {
//       jsonrpc: "2.0",
//       params,
//     });
//     if (response.data.error) {
//       throw new Error(
//         response.data.error.data.message || "Không thể tải thông tin hồ sơ."
//       );
//     }
//     if (response.data.result && response.data.result.length > 0) {
//       return response.data.result[0]; // Trả về đối tượng nhân viên đầu tiên tìm thấy
//     }
//     console.warn(
//       "Không tìm thấy hồ sơ nhân viên (hr.employee) cho người dùng này."
//     );
//     return {}; // Trả về object rỗng nếu không có
//   } catch (error) {
//     if (error.response?.data?.error) {
//       throw new Error(error.response.data.error.data.message);
//     }
//     throw new Error(error.message || "Lỗi khi tải hồ sơ người dùng.");
//   }
// };

// /**
//  * HÀM MỚI: Lấy thông tin chi tiết của một nhân viên bằng ID của chính nhân viên đó (hr.employee).
//  * Hiệu quả hơn search_read khi đã biết ID.
//  * @param {number} employeeId - ID của nhân viên (hr.employee)
//  * @returns {Promise<object>} - Dữ liệu chi tiết của nhân viên.
//  */
// export const fetchEmployeeById = async (employeeId) => {
//   const params = {
//     model: "hr.employee",
//     method: "read", // Sử dụng 'read' để lấy trực tiếp từ ID
//     args: [
//       [employeeId], // Odoo 'read' cần một mảng chứa các ID
//       PROFILE_FIELDS, // Tái sử dụng danh sách các trường đã định nghĩa
//     ],
//     kwargs: { context: { lang: "vi_VN" } },
//   };
//   try {
//     const response = await axiosInstance.post(URL.RPC_CALL, {
//       jsonrpc: "2.0",
//       params,
//     });
//     if (response.data.error) {
//       throw new Error(
//         response.data.error.data.message || "Không thể tải thông tin nhân viên."
//       );
//     }
//     // 'read' trả về một mảng các record, ta chỉ cần record đầu tiên
//     if (response.data.result && response.data.result.length > 0) {
//       return response.data.result[0];
//     }
//     throw new Error("Không tìm thấy nhân viên với ID đã cho.");
//   } catch (error) {
//     if (error.response?.data?.error) {
//       throw new Error(error.response.data.error.data.message);
//     }
//     throw new Error(error.message || "Lỗi khi tải hồ sơ nhân viên.");
//   }
// };

// /**
//  * Gửi yêu cầu cập nhật thông tin nhân viên.
//  * @param {number} employeeId - ID của nhân viên (hr.employee)
//  * @param {object} updateData - Các trường dữ liệu cần cập nhật
//  */
// export const updateProfile = async (employeeId, updateData) => {
//   // Model phải là 'hr.employee' vì các trường thông tin cá nhân nằm ở đây
//   const params = {
//     model: "hr.employee",
//     method: "write",
//     args: [[employeeId], updateData],
//     kwargs: { context: { lang: "vi_VN" } },
//   };
//   try {
//     const response = await axiosInstance.post(URL.RPC_CALL, {
//       jsonrpc: "2.0",
//       params,
//     });
//     if (response.data.error) {
//       throw new Error(
//         response.data.error.data.message || "Cập nhật thông tin thất bại."
//       );
//     }
//     return response.data.result; // Odoo 'write' trả về true
//   } catch (error) {
//     if (error.response && error.response.data && error.response.data.error) {
//       throw new Error(error.response.data.error.data.message);
//     }
//     throw new Error(error.message || "Đã xảy ra lỗi khi cập nhật thông tin.");
//   }
// };

// /**
//  * THÊM HÀM MỚI
//  * Lấy thông tin chi tiết các kỹ năng của nhân viên từ danh sách ID.
//  * @param {number[]} skill_ids - Mảng chứa các ID của hr.employee.skill
//  * @returns {Promise<Array>} - Mảng các đối tượng kỹ năng chi tiết
//  */
// export const fetchEmployeeSkills = async (skill_ids) => {
//   if (!skill_ids || skill_ids.length === 0) {
//     return []; // Trả về mảng rỗng nếu không có ID nào
//   }
//   const params = {
//     model: "hr.employee.skill", // Model chứa thông tin chi tiết kỹ năng
//     method: "read", // Dùng 'read' để lấy chi tiết từ ID
//     args: [
//       skill_ids,
//       ["id", "skill_id", "skill_level_id", "skill_type_id", "level_progress"], // Các trường cần lấy
//     ],
//     kwargs: {},
//   };
//   try {
//     const response = await axiosInstance.post(URL.RPC_CALL, {
//       jsonrpc: "2.0",
//       params,
//     });
//     if (response.data.error) {
//       throw new Error(
//         response.data.error.data.message || "Không thể tải danh sách kỹ năng."
//       );
//     }
//     return response.data.result;
//   } catch (error) {
//     console.error("Lỗi khi tải kỹ năng nhân viên:", error);
//     throw error;
//   }
// };

// // === CÁC HÀM API MỚI CHO VIỆC THÊM/XÓA KỸ NĂNG ===

// /**
//  * Lấy tất cả các loại kỹ năng (vd: Language, Programming).
//  */
// export const fetchSkillTypes = async () => {
//   const params = {
//     model: "hr.skill.type",
//     method: "search_read",
//     args: [[]],
//     kwargs: { fields: ["id", "name"] },
//   };
//   const response = await axiosInstance.post(URL.RPC_CALL, {
//     jsonrpc: "2.0",
//     params,
//   });
//   return response.data.result || []; // SỬA LỖI: Đảm bảo luôn trả về một mảng
// };

// /**
//  * HÀM API MỚI VÀ DUY NHẤT ĐỂ LẤY CẤP ĐỘ
//  * Lấy danh sách các cấp độ hợp lệ, bao gồm cả cấp độ chung (theo loại) và cấp độ riêng (theo kỹ năng).
//  * @param {number} typeId - ID của Loại kỹ năng đang được chọn.
//  * @param {number} skillId - ID của Tên kỹ năng đang được chọn.
//  */

// export const fetchSkillsByType = async (typeId) => {
//   const params = {
//     model: "hr.skill",
//     method: "search_read",
//     args: [[["skill_type_id", "=", typeId]]],
//     kwargs: { fields: ["id", "name"] },
//   };
//   const response = await axiosInstance.post(URL.RPC_CALL, {
//     jsonrpc: "2.0",
//     params,
//   });
//   return response.data.result || []; // SỬA LỖI: Đảm bảo luôn trả về một mảng
// };

// /**
//  * Lấy tất cả các cấp độ thuộc một LOẠI kỹ năng.
//  * Đây là logic đúng dựa trên dữ liệu và view của Odoo.
//  */
// export const fetchSkillLevelsByType = async (typeId) => {
//   const params = {
//     model: "hr.skill.level",
//     method: "search_read",
//     args: [[["skill_type_id", "=", typeId]]], // Lọc theo skill_type_id
//     kwargs: { fields: ["id", "name"] },
//   };
//   const response = await axiosInstance.post(URL.RPC_CALL, {
//     jsonrpc: "2.0",
//     params,
//   });
//   return response.data.result || [];
// };

// /**
//  * Lấy các cấp độ được phép DỰA TRÊN TÊN KỸ NĂNG cụ thể.
//  * Đây là logic bắt buộc phải tuân theo constraint của server Odoo.
//  */
// export const fetchSkillLevelsBySkill = async (skillId) => {
//   const params = {
//     model: "hr.skill.level",
//     method: "search_read",
//     args: [[["skill_id", "=", skillId]]], // Lọc theo skill_id
//     kwargs: { fields: ["id", "name"] },
//   };
//   const response = await axiosInstance.post(URL.RPC_CALL, {
//     jsonrpc: "2.0",
//     params,
//   });
//   return response.data.result || [];
// };

// export const addEmployeeSkill = async (skillData) => {
//   const params = {
//     model: "hr.employee.skill",
//     method: "create",
//     args: [skillData],
//     kwargs: {},
//   };
//   const response = await axiosInstance.post(URL.RPC_CALL, {
//     jsonrpc: "2.0",
//     params,
//   });
//   if (response.data.error) throw new Error(response.data.error.data.message);
//   return response.data.result;
// };

// export const deleteEmployeeSkill = async (skillLineId) => {
//   const params = {
//     model: "hr.employee.skill",
//     method: "unlink",
//     args: [[skillLineId]],
//     kwargs: {},
//   };
//   const response = await axiosInstance.post(URL.RPC_CALL, {
//     jsonrpc: "2.0",
//     params,
//   });
//   if (response.data.error) throw new Error(response.data.error.data.message);
//   return response.data.result;
// };

// /**
//  * THÊM HÀM MỚI
//  * Cập nhật một dòng kỹ năng đã có của nhân viên (chủ yếu là cập nhật skill_level_id).
//  */
// export const updateEmployeeSkill = async (skillLineId, data) => {
//   const params = {
//     model: "hr.employee.skill",
//     method: "write",
//     args: [[skillLineId], data], // data sẽ là { skill_level_id: newLevelId }
//     kwargs: {},
//   };
//   const response = await axiosInstance.post(URL.RPC_CALL, {
//     jsonrpc: "2.0",
//     params,
//   });
//   if (response.data.error) throw new Error(response.data.error.data.message);
//   return response.data.result;
// };

// // === CÁC HÀM API CHO VIỆC THÊM/XÓA KINH NGHIỆM LÀM VIỆC ===

// /**
//  * Lấy chi tiết các dòng kinh nghiệm làm việc (resume).
//  */
// export const fetchEmployeeResumeLines = async (resume_line_ids) => {
//   if (!resume_line_ids || resume_line_ids.length === 0) return [];
//   const params = {
//     model: "hr.resume.line",
//     method: "read",
//     args: [
//       resume_line_ids,
//       ["id", "name", "date_start", "date_end", "description", "line_type_id"],
//     ],
//     kwargs: {},
//   };
//   const response = await axiosInstance.post(URL.RPC_CALL, {
//     jsonrpc: "2.0",
//     params,
//   });
//   if (response.data.error) throw new Error(response.data.error.data.message);
//   return response.data.result;
// };

// export const deleteResumeLine = async (resumeLineId) => {
//   const params = {
//     model: "hr.resume.line",
//     method: "unlink",
//     args: [[resumeLineId]],
//     kwargs: {},
//   };
//   const response = await axiosInstance.post(URL.RPC_CALL, {
//     jsonrpc: "2.0",
//     params,
//   });
//   if (response.data.error) throw new Error(response.data.error.data.message);
//   return response.data.result;
// };

// /**
//  * Thêm 1 dòng kinh nghiệm (hr.resume.line)
//  * @param {Object} resumeData - { employee_id, name, date_start, date_end, description, line_type_id, ... }
//  * @returns {number} id của record mới tạo (theo response Odoo)
//  */
// export const addResumeLine = async (resumeData) => {
//   const params = {
//     model: "hr.resume.line",
//     method: "create",
//     args: [resumeData],
//     kwargs: {},
//   };
//   try {
//     const response = await axiosInstance.post(URL.RPC_CALL, {
//       jsonrpc: "2.0",
//       params,
//     });
//     if (response.data.error) {
//       throw new Error(response.data.error.data.message);
//     }
//     return response.data.result;
//   } catch (error) {
//     console.error("Lỗi khi thêm resume line:", error);
//     if (error.response?.data?.error) {
//       throw new Error(error.response.data.error.data.message);
//     }
//     throw new Error(error.message || "Đã xảy ra lỗi khi thêm resume.");
//   }
// };

// /**
//  * Cập nhật 1 dòng kinh nghiệm theo id
//  * @param {number} resumeLineId
//  * @param {Object} data - các trường cần cập nhật, ví dụ { name, date_start, date_end, description }
//  * @returns {boolean} true nếu cập nhật thành công
//  */
// export const updateResumeLine = async (resumeLineId, data) => {
//   const params = {
//     model: "hr.resume.line",
//     method: "write",
//     args: [[resumeLineId], data],
//     kwargs: {},
//   };
//   try {
//     const response = await axiosInstance.post(URL.RPC_CALL, {
//       jsonrpc: "2.0",
//       params,
//     });
//     if (response.data.error) {
//       throw new Error(response.data.error.data.message);
//     }
//     return response.data.result;
//   } catch (error) {
//     console.error("Lỗi khi cập nhật resume line:", error);
//     if (error.response?.data?.error) {
//       throw new Error(error.response.data.error.data.message);
//     }
//     throw new Error(error.message || "Đã xảy ra lỗi khi cập nhật resume.");
//   }
// };

// // Lấy danh sách quốc gia
// export const fetchCountries = async () => {
//   const params = {
//     model: "res.country",
//     method: "search_read",
//     args: [[], ["id", "name"]],
//     kwargs: { order: "name asc" },
//   };
//   const response = await axiosInstance.post(URL.RPC_CALL, {
//     jsonrpc: "2.0",
//     params,
//   });
//   if (response.data.error) throw new Error(response.data.error.data.message);
//   return response.data.result;
// };

// // Lấy danh sách tỉnh/thành theo country
// export const fetchStatesByCountry = async (countryId) => {
//   const params = {
//     model: "res.country.state",
//     method: "search_read",
//     args: [[["country_id", "=", countryId]], ["id", "name"]],
//     kwargs: { order: "name asc" },
//   };
//   const response = await axiosInstance.post(URL.RPC_CALL, {
//     jsonrpc: "2.0",
//     params,
//   });
//   if (response.data.error) throw new Error(response.data.error.data.message);
//   return response.data.result;
// };

// // === CÁC HÀM API MỚI CHO TRANG PHÒNG BAN & NHÂN VIÊN ===

// /**
//  * Lấy danh sách tất cả các phòng ban.
//  */
// export const fetchDepartments = async () => {
//   const params = {
//     model: "hr.department",
//     method: "search_read",
//     args: [[]],
//     kwargs: {
//       // Lấy thêm các trường từ XML bạn cung cấp
//       fields: [
//         "id",
//         "name",
//         "manager_id",
//         "total_employee",
//         "color",
//         "company_id",
//       ],
//       context: { lang: "vi_VN" },
//     },
//   };
//   const response = await axiosInstance.post(URL.RPC_CALL, {
//     jsonrpc: "2.0",
//     params,
//   });
//   if (response.data.error) throw new Error(response.data.error.data.message);
//   return response.data.result || [];
// };

// /**
//  * Lấy danh sách nhân viên với các tùy chọn linh hoạt.
//  * @param {Array} domain - Mảng điều kiện lọc của Odoo, vd: [['department_id', '=', 1]]
//  * @param {Array} fields - Mảng các trường cần lấy, vd: ['name', 'job_title']
//  * @param {number} limit - Số lượng bản ghi tối đa
//  * @param {number} offset - Vị trí bắt đầu lấy
//  */
// export const fetchEmployees = async ({
//   domain = [],
//   fields = [],
//   limit = 80,
//   offset = 0,
// }) => {
//   const params = {
//     model: "hr.employee",
//     method: "search_read",
//     args: [domain],
//     kwargs: {
//       fields:
//         fields.length > 0
//           ? fields
//           : [
//               "id",
//               "name",
//               "job_title",
//               "work_email",
//               "work_phone",
//               "image_128",
//             ],
//       limit,
//       offset,
//       context: { lang: "vi_VN" },
//     },
//   };
//   const response = await axiosInstance.post(URL.RPC_CALL, {
//     jsonrpc: "2.0",
//     params,
//   });
//   if (response.data.error) throw new Error(response.data.error.data.message);
//   return response.data.result || [];
// };

// /**
//  * [ADMIN] Tạo một bản ghi nhân viên mới.
//  * @param {object} employeeData - Dữ liệu của nhân viên mới (vd: { name, work_email, ... })
//  */
// export const createEmployee = async (employeeData) => {
//   const params = {
//     model: "hr.employee",
//     method: "create",
//     args: [employeeData],
//     kwargs: {},
//   };
//   const response = await axiosInstance.post(URL.RPC_CALL, {
//     jsonrpc: "2.0",
//     params,
//   });
//   if (response.data.error) throw new Error(response.data.error.data.message);
//   return response.data.result; // Trả về ID của nhân viên mới
// };

// /**
//  * [ADMIN] Vô hiệu hóa một nhân viên (an toàn hơn xóa).
//  * @param {number} employeeId - ID của nhân viên cần vô hiệu hóa.
//  */
// export const archiveEmployee = async (employeeId) => {
//   const params = {
//     model: "hr.employee",
//     method: "write",
//     args: [[employeeId], { active: false }], // Đặt trường active thành false
//     kwargs: {},
//   };
//   const response = await axiosInstance.post(URL.RPC_CALL, {
//     jsonrpc: "2.0",
//     params,
//   });
//   if (response.data.error) throw new Error(response.data.error.data.message);
//   return response.data.result; // Trả về true
// };

// // src/services/odooAPI.js
// export const apiFetch = async (path, method = "GET", body) => {
//   const opts = {
//     method,
//     headers: {
//       "Content-Type": "application/json",
//     },
//     credentials: "include",
//   };
//   if (body) opts.body = JSON.stringify(body);

//   const res = await fetch(path, opts);
//   return res.json();
// };

// /*========================*/
// /*CÁC API QUẢN TRỊ CÔNG VIỆC*/
// /*========================*/

// // ============================
// // PROJECTS
// // ============================
// /**
//  * HÀM MỚI: Lấy chi tiết (tên, màu sắc) của các thẻ (tags) từ một danh sách ID.
//  * Hàm này rất quan trọng để hiển thị các thẻ màu mè giống như Odoo.
//  * @param {number[]} tagIds - Mảng các ID của project.tags
//  * @returns {Promise<Array>} - Mảng các đối tượng tag, ví dụ: [{id: 1, name: 'Nội bộ', color: 9}]
//  */

// //FETCH TAGS

// export const fetchAllTags = async () => {
//   const params = {
//     model: "project.tags",
//     method: "search_read",
//     args: [[]],
//     kwargs: { fields: ["id", "name", "color"], order: "name asc" },
//   };
//   const response = await axiosInstance.post(URL.RPC_CALL, {
//     jsonrpc: "2.0",
//     params,
//   });
//   if (response.data.error) throw new Error(response.data.error.data.message);
//   return response.data.result || [];
// };

// export const fetchTagsDetails = async (tagIds) => {
//   // Nếu không có tagIds thì trả về mảng rỗng để tránh gọi API không cần thiết
//   if (!tagIds || tagIds.length === 0) {
//     return [];
//   }
//   const params = {
//     model: "project.tags",
//     method: "search_read",
//     // Domain: tìm tất cả các tag có id nằm trong danh sách tagIds
//     args: [[["id", "in", tagIds]]],
//     kwargs: {
//       fields: ["id", "name", "color"],
//     },
//   };
//   try {
//     const response = await axiosInstance.post(URL.RPC_CALL, {
//       jsonrpc: "2.0",
//       params,
//     });
//     if (response.data.error) {
//       throw new Error(response.data.error.data.message);
//     }
//     return response.data.result || [];
//   } catch (error) {
//     console.error("Lỗi khi tải chi tiết tags:", error);
//     // Trả về mảng rỗng để không làm crash giao diện nếu có lỗi
//     return [];
//   }
// };

// export const createTag = async (tagData) => {
//   const params = {
//     model: "project.tags",
//     method: "create",
//     args: [tagData], // {name: "Tên thẻ", color: 5}
//     kwargs: {},
//   };
//   const response = await axiosInstance.post(URL.RPC_CALL, {
//     jsonrpc: "2.0",
//     params,
//   });
//   if (response.data.error) throw new Error(response.data.error.data.message);
//   return response.data.result; // id tag mới
// };

// //FETCH PROJECTS

// export const fetchProjects = async () => {
//   const params = {
//     model: "project.project",
//     method: "search_read",
//     args: [[]],
//     kwargs: {
//       fields: ["id", "name", "user_id", "date_start"],
//       order: "date_start desc",
//     },
//   };
//   try {
//     const response = await axiosInstance.post(URL.RPC_CALL, {
//       jsonrpc: "2.0",
//       params,
//     });
//     if (response.data.error) throw new Error(response.data.error.data.message);
//     return response.data.result || [];
//   } catch (error) {
//     if (error.response?.data?.error)
//       throw new Error(error.response.data.error.data.message);
//     throw new Error(error.message || "Lỗi tải danh sách dự án");
//   }
// };

// /**
//  * Lấy thông tin chi tiết của một dự án bằng ID.
//  * @param {number} projectId - ID của project.project
//  * @returns {Promise<object>}
//  */
// export const fetchProjectById = async (projectId) => {
//   const params = {
//     model: "project.project",
//     method: "read", // Dùng 'read' hiệu quả hơn 'search_read' khi đã biết ID
//     args: [
//       [parseInt(projectId)], // 'read' yêu cầu mảng các ID
//       [
//         // Liệt kê các trường bạn cần cho trang chi tiết
//         "name",
//         "user_id",
//         "partner_id",
//         "date_start",
//         "date",
//       ],
//     ],
//     kwargs: {},
//   };
//   try {
//     const response = await axiosInstance.post(URL.RPC_CALL, {
//       jsonrpc: "2.0",
//       params,
//     });
//     if (response.data.error) throw new Error(response.data.error.data.message);
//     if (response.data.result && response.data.result.length > 0) {
//       return response.data.result[0];
//     }
//     throw new Error("Không tìm thấy dự án.");
//   } catch (error) {
//     console.error("Lỗi khi tải chi tiết dự án:", error);
//     throw error;
//   }
// };

// // NÂNG CẤP: Chấp nhận domain và order để tìm kiếm, lọc, sắp xếp
// export const fetchProjectsWithDetail = async ({
//   domain = [],
//   order = "date_start desc",
// }) => {
//   try {
//     const projectsParams = {
//       model: "project.project",
//       method: "search_read",
//       args: [[["user_id", "!=", 1], ...domain]], // Kết hợp domain mặc định và domain từ tham số
//       kwargs: {
//         fields: [
//           "id",
//           "name",
//           "is_favorite",
//           "partner_id",
//           "company_id",
//           "date_start",
//           "date",
//           "allocated_hours",
//           "effective_hours",
//           "remaining_hours",
//           "milestone_progress",
//           "next_milestone_id",
//           "user_id",
//           "tag_ids",
//           "last_update_status",
//           "last_update_color",
//           "stage_id",
//         ],
//         order: order, // Sử dụng tham số order
//       },
//     };

//     const response = await axiosInstance.post(URL.RPC_CALL, {
//       jsonrpc: "2.0",
//       params: projectsParams,
//     });

//     if (response.data.error) throw new Error(response.data.error.data.message);

//     const projects = response.data.result || [];
//     if (projects.length === 0) return [];

//     const allTagIds = [...new Set(projects.flatMap((p) => p.tag_ids || []))];
//     const tagsDetails = await fetchTagsDetails(allTagIds);
//     const tagsMap = new Map(tagsDetails.map((tag) => [tag.id, tag]));

//     return projects.map((proj) => ({
//       id: proj.id,
//       display_name: proj.name || "Không tên",
//       user_id: proj.user_id || [0, "Chưa gán"],
//       partner_id: proj.partner_id || [0, "N/A"],
//       company_id: proj.company_id || [0, "N/A"],
//       planned_date: `${proj.date_start || ""} → ${proj.date || ""}`.replace(
//         /^ → | → $/g,
//         ""
//       ),
//       milestone_progress: proj.milestone_progress || 0,
//       allocated_hours: proj.allocated_hours || 0,
//       effective_hours: proj.effective_hours || 0,
//       remaining_hours: proj.remaining_hours || 0,
//       tags: (proj.tag_ids || [])
//         .map((id) => tagsMap.get(id))
//         .filter(Boolean)
//         .map((tag) => ({
//           id: tag.id,
//           name: tag.name || "Không tên",
//           color: tag.color ?? 0,
//         })),
//       status: {
//         name: proj.last_update_status || "N/A",
//         color: proj.last_update_color ?? 0,
//       },
//       stage_id: proj.stage_id || [0, "Chưa xác định"],
//     }));
//   } catch (error) {
//     console.error("fetchProjectsWithDetail error:", error);
//     throw new Error(error.message || "Lỗi tải danh sách dự án");
//   }
// };

// //FETCH STAGES

// export async function fetchAllProjectStages() {
//   const params = {
//     model: "project.project.stage", // đúng model stage của Project
//     method: "search_read",
//     args: [[]],
//     kwargs: {
//       fields: ["id", "name", "sequence"], // bỏ "color"
//       order: "sequence ASC",
//     },
//   };
//   const response = await axiosInstance.post(URL.RPC_CALL, {
//     jsonrpc: "2.0",
//     params,
//   });
//   if (response.data.error) throw new Error(response.data.error.data.message);
//   return response.data.result || [];
// }

// export const fetchStagesDetails = async (stageIds) => {
//   if (!stageIds || stageIds.length === 0) return [];
//   const params = {
//     model: "project.project.stage",
//     method: "search_read",
//     args: [[["id", "in", stageIds]]],
//     kwargs: { fields: ["id", "name", "color"] },
//   };
//   const response = await axiosInstance.post(URL.RPC_CALL, {
//     jsonrpc: "2.0",
//     params,
//   });
//   return response.data.result || [];
// };

// export const createProject = async (projectData) => {
//   const params = {
//     model: "project.project",
//     method: "create",
//     args: [projectData],
//     kwargs: {}, // luôn có kwargs
//   };
//   try {
//     const response = await axiosInstance.post(URL.RPC_CALL, {
//       jsonrpc: "2.0",
//       params,
//     });
//     if (response.data.error) throw new Error(response.data.error.data.message);
//     return response.data.result; // trả về ID của project mới
//   } catch (error) {
//     if (error.response?.data?.error)
//       throw new Error(error.response.data.error.data.message);
//     throw new Error(error.message || "Lỗi tạo dự án");
//   }
// };

// /* CHỈNH SỬA THÔNG TIN DỰ ÁN */

// export const updateProject = async (projectId, data) => {
//   const params = {
//     model: "project.project",
//     method: "write",
//     args: [[projectId], data],
//     kwargs: {},
//   };
//   try {
//     const response = await axiosInstance.post(URL.RPC_CALL, {
//       jsonrpc: "2.0",
//       params,
//     });
//     if (response.data.error) throw new Error(response.data.error.data.message);
//     return response.data.result; // true nếu thành công
//   } catch (error) {
//     throw new Error(error.message || "Lỗi cập nhật dự án");
//   }
// };

// // Xóa dự án theo ID
// export const deleteProject = async (projectId) => {
//   const params = {
//     model: "project.project",
//     method: "unlink",
//     args: [[projectId]], // unlink yêu cầu mảng ID
//     kwargs: {},
//   };
//   try {
//     const response = await axiosInstance.post(URL.RPC_CALL, {
//       jsonrpc: "2.0",
//       params,
//     });
//     if (response.data.error) throw new Error(response.data.error.data.message);
//     return response.data.result; // Odoo trả về true nếu xóa thành công
//   } catch (error) {
//     console.error("Lỗi khi xóa dự án:", error);
//     throw error;
//   }
// };

// // ============================
// // TASKS
// // ============================
// // HÀM MỚI: Lấy tất cả các giai đoạn của task cho một dự án cụ thể (dùng cho Kanban)
// export const fetchTaskStagesForProject = async (projectIds) => {
//   const params = {
//     model: "project.task.type", // Model của stage task
//     method: "search_read",
//     args: [[["project_ids", "in", projectIds]]],
//     kwargs: {
//       fields: ["id", "name", "sequence", "fold"],
//       order: "sequence asc",
//     },
//   };
//   try {
//     const response = await axiosInstance.post(URL.RPC_CALL, {
//       jsonrpc: "2.0",
//       params,
//     });
//     if (response.data.error) throw new Error(response.data.error.data.message);
//     return response.data.result || [];
//   } catch (error) {
//     throw new Error(error.message || "Lỗi tải các giai đoạn của task");
//   }
// };
// export const fetchTasksByProject = async ({
//   projectId,
//   page = 1,
//   pageSize = 10,
//   domain = [], // Thêm domain để lọc
//   order = "sequence, priority desc", // Thêm order để sắp xếp
// }) => {
//   const offset = (page - 1) * pageSize;
//   const fullDomain = [["project_id", "=", projectId], ...domain]; // Kết hợp domain mặc định và domain truyền vào

//   // 1. Lấy tổng số task với domain đã lọc
//   const countParams = {
//     model: "project.task",
//     method: "search_count",
//     args: [fullDomain],
//     kwargs: {},
//   };
//   const countResponse = await axiosInstance.post(URL.RPC_CALL, {
//     jsonrpc: "2.0",
//     params: countParams,
//   });
//   if (countResponse.data.error)
//     throw new Error(countResponse.data.error.data.message);
//   const total = countResponse.data.result;

//   // 2. Lấy danh sách task của trang hiện tại với domain và order
//   const dataParams = {
//     model: "project.task",
//     method: "search_read",
//     args: [fullDomain],
//     kwargs: {
//       // THAY ĐỔI: Mở rộng danh sách các trường ở đây
//       fields: [
//         "id",
//         "name",
//         "milestone_id",
//         "partner_id",
//         "parent_id", // Nhiệm vụ cha
//         "user_ids",
//         "allocated_hours",
//         "effective_hours",
//         "subtask_effective_hours",
//         "total_hours_spent",
//         "remaining_hours",
//         "progress",
//         "date_deadline",
//         "activity_ids", // Hoạt động tiếp theo
//         "my_activity_date_deadline", // Thời hạn của tôi
//         "rating_last_text", // Đánh giá
//         "tag_ids", // Thẻ
//         "date_last_stage_update", // Cập nhật giai đoạn lần cuối
//         "stage_id", // Giai đoạn
//         "create_uid",
//         "is_closed",
//         "personal_stage_type_id", // Giai đoạn cá nhân
//         "priority",
//         "priority_level",
//         "sequence",
//       ],
//       order: order,
//       limit: pageSize,
//       offset: offset,
//     },
//   };
//   const dataResponse = await axiosInstance.post(URL.RPC_CALL, {
//     jsonrpc: "2.0",
//     params: dataParams,
//   });
//   if (dataResponse.data.error)
//     throw new Error(dataResponse.data.error.data.message);

//   // 3. Trả về cả danh sách task và tổng số
//   return {
//     tasks: dataResponse.data.result || [],
//     total: total,
//   };
// };

// export const fetchTaskById = async (taskId) => {
//   const params = {
//     model: "project.task",
//     method: "read",
//     args: [
//       [taskId],
//       [
//         "id",
//         "name",
//         "user_id",
//         "stage_id",
//         "description",
//         "date_deadline",
//         "priority",
//       ],
//     ],
//   };
//   try {
//     const response = await axiosInstance.post(URL.RPC_CALL, {
//       jsonrpc: "2.0",
//       params,
//     });
//     if (response.data.error) throw new Error(response.data.error.data.message);
//     return response.data.result?.[0] || null;
//   } catch (error) {
//     if (error.response?.data?.error)
//       throw new Error(error.response.data.error.data.message);
//     throw new Error(error.message || "Lỗi tải chi tiết task");
//   }
// };

// /**
//  * Lấy TOÀN BỘ thông tin chi tiết của một nhiệm vụ để hiển thị trên trang chi tiết.
//  * @param {number} taskId - ID của project.task
//  * @returns {Promise<object>}
//  */
// export const fetchTaskDetails = async (taskId) => {
//   const params = {
//     model: "project.task",
//     method: "read", // Dùng 'read' để lấy trực tiếp từ ID, rất hiệu quả
//     args: [
//       [taskId],
//       // Liệt kê tất cả các trường cần thiết cho trang chi tiết, dựa trên mẫu Odoo
//       [
//         "name",
//         "project_id",
//         "user_ids",
//         "portal_user_names",
//         "partner_id", // Trong ngữ cảnh của bạn là "Người quản lý"
//         "date_deadline",
//         "description",
//         "stage_id",
//         "tag_ids",
//         "milestone_id",
//         "priority",
//         "parent_id",
//         "child_ids",
//         "timesheet_ids",
//         "is_closed", // Dùng để xác định icon Hoàn thành/Đang làm
//         "create_uid", // Dùng để xác định người tạo task
//         "active", // Dùng cho chức năng xóa mềm
//         "message_follower_ids", // Dùng cho chatter
//         "message_ids", // Dùng cho chatter
//         "activity_ids", // Dùng cho chatter
//       ],
//     ],
//     kwargs: {},
//   };
//   try {
//     const response = await axiosInstance.post(URL.RPC_CALL, {
//       jsonrpc: "2.0",
//       params,
//     });
//     if (response.data.error) throw new Error(response.data.error.data.message);
//     // 'read' trả về một mảng chứa một đối tượng duy nhất
//     return response.data.result?.[0] || null;
//   } catch (error) {
//     if (error.response?.data?.error)
//       throw new Error(error.response.data.error.data.message);
//     throw new Error(error.message || "Lỗi khi tải chi tiết nhiệm vụ.");
//   }
// };

// export const createTask = async (taskData) => {
//   const params = {
//     model: "project.task",
//     method: "create",
//     args: [taskData],
//     kwargs: {},
//   };
//   try {
//     const response = await axiosInstance.post(URL.RPC_CALL, {
//       jsonrpc: "2.0",
//       params,
//     });
//     if (response.data.error) throw new Error(response.data.error.data.message);
//     return response.data.result;
//   } catch (error) {
//     if (error.response?.data?.error)
//       throw new Error(error.response.data.error.data.message);
//     throw new Error(error.message || "Lỗi tạo task");
//   }
// };

// /**
//  * Fetch task theo domain tùy chỉnh, hỗ trợ phân trang
//  */
// export const fetchTasksByDomain = async ({
//   domain = [],
//   page = 1,
//   pageSize = 10,
// }) => {
//   const offset = (page - 1) * pageSize;

//   const countParams = {
//     model: "project.task",
//     method: "search_count",
//     args: [domain],
//     kwargs: {},
//   };
//   const countResponse = await axiosInstance.post(URL.RPC_CALL, {
//     jsonrpc: "2.0",
//     params: countParams,
//   });
//   if (countResponse.data.error)
//     throw new Error(countResponse.data.error.data.message);
//   const total = countResponse.data.result;

//   const dataParams = {
//     model: "project.task",
//     method: "search_read",
//     args: [domain],
//     kwargs: {
//       fields: [
//         "id",
//         "name",
//         "user_ids",
//         "stage_id",
//         "date_deadline",
//         "project_id",
//       ],
//       order: "date_deadline desc, priority desc",
//       limit: pageSize,
//       offset: offset,
//     },
//   };
//   const dataResponse = await axiosInstance.post(URL.RPC_CALL, {
//     jsonrpc: "2.0",
//     params: dataParams,
//   });
//   if (dataResponse.data.error)
//     throw new Error(dataResponse.data.error.data.message);

//   return {
//     tasks: dataResponse.data.result || [],
//     total: total,
//   };
// };

// export const updateTask = async (taskId, data) => {
//   const params = {
//     model: "project.task",
//     method: "write",
//     args: [[taskId], data],
//     kwargs: {},
//   };
//   try {
//     const response = await axiosInstance.post(URL.RPC_CALL, {
//       jsonrpc: "2.0",
//       params,
//     });
//     if (response.data.error) throw new Error(response.data.error.data.message);
//     return response.data.result;
//   } catch (error) {
//     if (error.response?.data?.error)
//       throw new Error(error.response.data.error.data.message);
//     throw new Error(error.message || "Lỗi cập nhật task");
//   }
// };

// //Archive task (Xoá nhiệm vụ / lưu trữ 30 ngày)

// export const archiveTask = async (taskId) => {
//   // Thực chất là gọi hàm update và set trường 'active' thành false
//   return updateTask(taskId, { active: false });
// };

// //Restore task (Khôi phục nhiệm vụ đã xoá)
// export const restoreTask = async (taskId) => {
//   return updateTask(taskId, { active: true });
// };

// // Xoá task vĩnh viễn
// export const deleteTask = async (taskId) => {
//   const params = {
//     model: "project.task",
//     method: "unlink",
//     args: [[taskId]],
//     kwargs: {},
//   };
//   try {
//     const response = await axiosInstance.post(URL.RPC_CALL, {
//       jsonrpc: "2.0",
//       params,
//     });
//     if (response.data.error) throw new Error(response.data.error.data.message);
//     return response.data.result;
//   } catch (error) {
//     if (error.response?.data?.error)
//       throw new Error(error.response.data.error.data.message);
//     throw new Error(error.message || "Lỗi xóa task");
//   }
// };

// //MESSAGE & CHATTER APIS

// /**
//  * Lấy chi tiết các tin nhắn (mail.message) từ một danh sách ID.
//  * @param {number[]} messageIds - Mảng các ID của mail.message
//  * @returns {Promise<Array>} - Mảng các đối tượng tin nhắn chi tiết
//  */
// export const fetchMessages = async (messageIds) => {
//   if (!messageIds || messageIds.length === 0) {
//     return [];
//   }
//   const params = {
//     model: "mail.message",
//     method: "search_read",
//     args: [[["id", "in", messageIds]]],
//     kwargs: {
//       fields: [
//         "id",
//         "body",
//         "date",
//         "author_id", // [id, name]
//         "message_type", // 'comment', 'notification', ...
//         "subtype_id", // [id, name]
//         "attachment_ids",
//       ],
//       order: "date asc", // Sắp xếp từ cũ nhất đến mới nhất
//     },
//   };

//   try {
//     const response = await axiosInstance.post(URL.RPC_CALL, {
//       jsonrpc: "2.0",
//       params,
//     });
//     if (response.data.error) throw new Error(response.data.error.data.message);
//     return response.data.result || [];
//   } catch (err) {
//     console.error("Lỗi khi tải tin nhắn chatter:", err);
//     throw err;
//   }
// };
// /**
//  * Lấy chi tiết của những người theo dõi (mail.followers) từ ID của họ.
//  * @param {number[]} followerIds - Mảng các ID của mail.followers
//  */
// export const fetchFollowers = async (followerIds) => {
//   if (!followerIds || followerIds.length === 0) return [];
//   const params = {
//     model: "mail.followers",
//     method: "read",
//     args: [followerIds, ["id", "partner_id"]],
//     kwargs: {},
//   };
//   const response = await axiosInstance.post(URL.RPC_CALL, {
//     jsonrpc: "2.0",
//     params,
//   });
//   if (response.data.error) throw new Error(response.data.error.data.message);
//   return response.data.result || [];
// };

// /**
//  * Thêm người theo dõi vào một task.
//  * @param {number} taskId - ID của task
//  * @param {number[]} partnerIds - Mảng các partner_id cần thêm
//  */
// export const followTask = async (taskId, partnerIds) => {
//   const params = {
//     model: "project.task",
//     method: "message_subscribe",
//     args: [[taskId], partnerIds],
//     kwargs: {},
//   };
//   const response = await axiosInstance.post(URL.RPC_CALL, {
//     jsonrpc: "2.0",
//     params,
//   });
//   if (response.data.error) throw new Error(response.data.error.data.message);
//   return response.data.result;
// };

// /**
//  * Hủy theo dõi một task.
//  * @param {number} taskId - ID của task
//  * @param {number[]} partnerIds - Mảng các partner_id cần xóa
//  */
// export const unfollowTask = async (taskId, partnerIds) => {
//   const params = {
//     model: "project.task",
//     method: "message_unsubscribe",
//     args: [[taskId], partnerIds],
//     kwargs: {},
//   };
//   const response = await axiosInstance.post(URL.RPC_CALL, {
//     jsonrpc: "2.0",
//     params,
//   });
//   if (response.data.error) throw new Error(response.data.error.data.message);
//   return response.data.result;
// };

// /**
//  * Tạo một file đính kèm mới.
//  * @param {object} attachmentData - { name, datas, res_model, res_id }
//  */
// export const createAttachment = async (attachmentData) => {
//   const params = {
//     model: "ir.attachment",
//     method: "create",
//     args: [attachmentData],
//     kwargs: {},
//   };
//   const response = await axiosInstance.post(URL.RPC_CALL, {
//     jsonrpc: "2.0",
//     params,
//   });
//   if (response.data.error) throw new Error(response.data.error.data.message);
//   return response.data.result;
// };

// /**
//  * Lấy chi tiết các file đính kèm (ir.attachment) từ danh sách ID.
//  * @param {number[]} attachmentIds - Mảng các ID của ir.attachment
//  */
// export const fetchAttachmentDetails = async (attachmentIds) => {
//   if (!attachmentIds || attachmentIds.length === 0) return [];
//   const params = {
//     model: "ir.attachment",
//     method: "read",
//     args: [attachmentIds, ["id", "name", "mimetype"]],
//     kwargs: {},
//   };
//   const response = await axiosInstance.post(URL.RPC_CALL, {
//     jsonrpc: "2.0",
//     params,
//   });
//   if (response.data.error) throw new Error(response.data.error.data.message);
//   return response.data.result || [];
// };
