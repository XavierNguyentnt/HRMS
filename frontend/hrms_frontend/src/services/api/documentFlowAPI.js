//frontend\hrms_frontend\src\services\api\documentFlowAPI.js
import axiosInstance from "../../utils/axios_instance";
import URL from "../../utils/url";

/**
 * Lấy danh sách các bước xử lý (routes) của một văn bản
 * @param {number} documentId - ID của văn bản (model: dms.file)
 * @returns {Promise<Array>} - Danh sách route
 */
export const getDocumentRoutes = async (documentId) => {
  try {
    const response = await axiosInstance.post(
      `/api/document/${documentId}/routes`,
      {}
    );
    if (response.data.error) throw new Error(response.data.error);
    return response.data.result || response.data.routes || [];
  } catch (error) {
    console.error("❌ Lỗi khi lấy danh sách route:", error);
    throw new Error(error.message || "Không thể lấy danh sách route.");
  }
};

/**
 * Gửi lệnh chuyển bước xử lý (advance)
 * @param {number} documentId - ID của văn bản
 * @returns {Promise<object>} - Kết quả trả về từ Odoo
 */
export const advanceDocumentRoute = async (documentId) => {
  try {
    const response = await axiosInstance.post(
      `/api/document/${documentId}/advance`,
      {}
    );
    if (response.data.error) throw new Error(response.data.error);
    return response.data.result || response.data;
  } catch (error) {
    console.error("❌ Lỗi khi chuyển bước văn bản:", error);
    throw new Error(error.message || "Không thể chuyển bước văn bản.");
  }
};

/**
 * Tạo mới một bước xử lý (route) cho văn bản
 * @param {number} documentId - ID của văn bản
 * @param {object} routeData - Dữ liệu route
 * {
 *   sequence: 10,
 *   from_department_id: 1,
 *   to_department_id: 2,
 *   assigned_to: 5,
 *   action_type: "approve",
 *   note: "Trình lên phòng giám đốc"
 * }
 */
export const createDocumentRoute = async (documentId, routeData) => {
  try {
    const response = await axiosInstance.post(
      `/api/document/${documentId}/routes/create`,
      routeData
    );
    if (response.data.error) throw new Error(response.data.error);
    return response.data.result || response.data;
  } catch (error) {
    console.error("❌ Lỗi khi tạo route mới:", error);
    throw new Error(error.message || "Không thể tạo route mới.");
  }
};
