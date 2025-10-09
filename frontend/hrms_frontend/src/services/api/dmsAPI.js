// src/services/api/dmsAPI.js
import axiosInstance from "../../util/axios_instance";
import URL from "../../util/url";

/**
 * Lấy danh sách văn bản (model: dms.file)
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
        "directory_id",
        "company_id",
        "mimetype",
        "extension",
        "create_uid",
        "create_date",
        "write_date",
        "human_size",
        "path_names",
        "icon_url",
        "access_url",
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
 * Lấy chi tiết 1 văn bản
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
        "directory_id",
        "company_id",
        "mimetype",
        "extension",
        "create_uid",
        "create_date",
        "write_date",
        "human_size",
        "path_names",
        "icon_url",
        "access_url",
        "description",
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
 * 🆕 Tạo mới file DMS (upload thực tế qua ir.attachment)
 * @param {Object} fileData
 * @param {string} fileData.name - Tên file
 * @param {string} fileData.mimetype - Kiểu MIME
 * @param {string} fileData.base64Data - Nội dung file base64
 * @param {number} [fileData.directory_id] - ID thư mục đích (tuỳ chọn)
 * @param {number} [fileData.company_id] - ID công ty (tuỳ chọn)
 */
export const createDocument = async (fileData) => {
  try {
    // 1️⃣ Tạo attachment chứa dữ liệu thực tế
    const attachParams = {
      model: "ir.attachment",
      method: "create",
      args: [
        {
          name: fileData.name,
          datas: fileData.base64Data,
          mimetype: fileData.mimetype || "application/octet-stream",
          res_model: "dms.file",
          type: "binary",
        },
      ],
      kwargs: { context: { lang: "vi_VN" } },
    };

    const attachResponse = await axiosInstance.post(URL.RPC_CALL, {
      jsonrpc: "2.0",
      params: attachParams,
    });

    if (attachResponse.data.error)
      throw new Error(attachResponse.data.error.data.message);

    const attachmentId = attachResponse.data.result;

    // 2️⃣ Tạo dms.file và liên kết đến attachment vừa tạo
    const fileParams = {
      model: "dms.file",
      method: "create",
      args: [
        {
          name: fileData.name,
          attachment_id: attachmentId,
          directory_id: fileData.directory_id || false,
          company_id: fileData.company_id || false,
          mimetype: fileData.mimetype,
          save_type: "database",
        },
      ],
      kwargs: { context: { lang: "vi_VN" } },
    };

    const fileResponse = await axiosInstance.post(URL.RPC_CALL, {
      jsonrpc: "2.0",
      params: fileParams,
    });

    if (fileResponse.data.error)
      throw new Error(fileResponse.data.error.data.message);

    return fileResponse.data.result; // Trả về ID của bản ghi dms.file
  } catch (error) {
    console.error("Lỗi khi tạo mới tài liệu:", error);
    throw new Error(error.message || "Không thể tạo tài liệu mới.");
  }
};
