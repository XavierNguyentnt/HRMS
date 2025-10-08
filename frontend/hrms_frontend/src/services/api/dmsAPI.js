// src/services/api/dmsAPI.js
import axiosInstance from "../../util/axios_instance";
import URL from "../../util/url";

/**
 * Lấy danh sách văn bản (model: dms.file)
 * @param {Array} filters - Bộ lọc dạng Odoo domain
 * @param {number} limit - Giới hạn số bản ghi
 */
export const fetchDocuments = async (filters = [], limit = 100) => {
  const params = {
    model: "dms.file",
    method: "search_read",
    args: [filters],
    kwargs: {
      fields: [
        "id",
        "name",
        "ref_no",
        "status",
        "department_id",
        "date_received",
      ],
      order: "create_date desc",
      limit,
      context: { lang: "vi_VN" },
    },
  };

  try {
    const response = await axiosInstance.post(URL.RPC_CALL, {
      jsonrpc: "2.0",
      params,
    });
    if (response.data.error) throw new Error(response.data.error.data.message);
    return response.data.result || [];
  } catch (error) {
    console.error("Lỗi khi tải danh sách văn bản:", error);
    throw new Error(error.message || "Không thể tải danh sách văn bản.");
  }
};

/**
 * Lấy chi tiết một văn bản (theo ID)
 */
export const fetchDocumentDetail = async (id) => {
  const params = {
    model: "dms.file",
    method: "read",
    args: [
      [id],
      [
        "id",
        "name",
        "ref_no",
        "summary",
        "status",
        "department_id",
        "date_received",
        "route_ids",
      ],
    ],
    kwargs: { context: { lang: "vi_VN" } },
  };

  try {
    const response = await axiosInstance.post(URL.RPC_CALL, {
      jsonrpc: "2.0",
      params,
    });
    if (response.data.error) throw new Error(response.data.error.data.message);
    return response.data.result?.[0] || {};
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết văn bản:", error);
    throw new Error(error.message || "Không thể tải chi tiết văn bản.");
  }
};

/**
 * Tạo mới văn bản
 * @param {Object} data - Dữ liệu của văn bản cần tạo
 */
export const createDocument = async (data) => {
  const params = {
    model: "dms.file",
    method: "create",
    args: [data],
    kwargs: { context: { lang: "vi_VN" } },
  };

  try {
    const response = await axiosInstance.post(URL.RPC_CALL, {
      jsonrpc: "2.0",
      params,
    });
    if (response.data.error) throw new Error(response.data.error.data.message);
    return response.data.result; // Trả về ID của văn bản mới
  } catch (error) {
    console.error("Lỗi khi tạo mới văn bản:", error);
    throw new Error(error.message || "Không thể tạo mới văn bản.");
  }
};

/**
 * Cập nhật thông tin văn bản
 * @param {number} id - ID của văn bản
 * @param {object} updateData - Các trường cần cập nhật
 */
export const updateDocument = async (id, updateData) => {
  const params = {
    model: "dms.file",
    method: "write",
    args: [[id], updateData],
    kwargs: { context: { lang: "vi_VN" } },
  };

  try {
    const response = await axiosInstance.post(URL.RPC_CALL, {
      jsonrpc: "2.0",
      params,
    });
    if (response.data.error) throw new Error(response.data.error.data.message);
    return response.data.result; // true nếu cập nhật thành công
  } catch (error) {
    console.error("Lỗi khi cập nhật văn bản:", error);
    throw new Error(error.message || "Không thể cập nhật văn bản.");
  }
};
