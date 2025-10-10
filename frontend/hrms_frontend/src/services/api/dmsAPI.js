// src/services/api/dmsAPI.js
import axiosInstance from "../../util/axios_instance";
import URL from "../../util/url";

/**
 * Tính dung lượng file từ base64
 */
const bytesLengthFromBase64 = (base64) => {
  if (!base64) return 0;
  let padding = 0;
  if (base64.endsWith("==")) padding = 2;
  else if (base64.endsWith("=")) padding = 1;
  return (base64.length * 3) / 4 - padding;
};

/**
 * Chuyển byte -> human-readable
 */
const humanFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  else if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  else return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

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
        "attachment_id",
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

    const docs = response.data.result || [];

    // Nếu file nào chưa có human_size, truy vấn sang ir.attachment
    const fixedDocs = await Promise.all(
      docs.map(async (doc) => {
        if (doc.human_size) return doc;

        if (doc.attachment_id?.[0]) {
          try {
            const attParams = {
              model: "ir.attachment",
              method: "read",
              args: [[doc.attachment_id[0]], ["file_size"]],
              kwargs: {},
            };
            const attRes = await axiosInstance.post(URL.RPC_CALL, {
              jsonrpc: "2.0",
              params: attParams,
            });
            const attach = attRes.data.result?.[0];
            if (attach?.file_size) {
              return {
                ...doc,
                size: attach.file_size,
                human_size: humanFileSize(attach.file_size),
              };
            }
          } catch {
            // bỏ qua nếu lỗi nhỏ
          }
        }

        // fallback nếu không lấy được size
        return { ...doc, size: 0, human_size: "0 B" };
      })
    );

    return fixedDocs;
  } catch (error) {
    console.error("❌ Lỗi khi tải danh sách văn bản:", error);
    throw new Error(error.message || "Không thể tải danh sách văn bản.");
  }
};

/**
 * Lấy chi tiết 1 văn bản
 * Luôn trả về size & human_size chính xác.
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
        "attachment_id",
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
    const doc = response.data.result?.[0] || {};

    if (!doc.human_size && doc.attachment_id?.[0]) {
      const attParams = {
        model: "ir.attachment",
        method: "read",
        args: [[doc.attachment_id[0]], ["file_size"]],
      };
      const attRes = await axiosInstance.post(URL.RPC_CALL, {
        jsonrpc: "2.0",
        params: attParams,
      });
      const attach = attRes.data.result?.[0];
      if (attach?.file_size) {
        doc.size = attach.file_size;
        doc.human_size = humanFileSize(attach.file_size);
      }
    }

    return doc;
  } catch (error) {
    console.error("❌ Lỗi khi lấy chi tiết văn bản:", error);
    throw new Error(error.message || "Không thể tải chi tiết văn bản.");
  }
};

/**
 * Tạo mới file DMS (upload qua ir.attachment)
 * Trả về luôn size và human_size chính xác
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
    const fileId = fileResponse.data.result;

    // 3️⃣ Tính size & human_size từ base64
    const sizeInBytes = bytesLengthFromBase64(fileData.base64Data);
    const humanSize = humanFileSize(sizeInBytes);

    return {
      id: fileId,
      name: fileData.name,
      attachment_id: attachmentId,
      directory_id: fileData.directory_id || false,
      company_id: fileData.company_id || false,
      mimetype: fileData.mimetype,
      save_type: "database",
      size: sizeInBytes,
      human_size: humanSize,
      access_url: `/my/dms/file/${fileId}/download`,
    };
  } catch (error) {
    console.error("Lỗi khi tạo mới tài liệu:", error);
    throw new Error(error.message || "Không thể tạo tài liệu mới.");
  }
};

/*GET DIRECTORIES TREE*/
export const fetchDirectories = async () => {
  try {
    const BFF_BASE =
      process.env.REACT_APP_BFF_URL || "http://localhost:8000/api/ai";

    const response = await fetch(`${BFF_BASE}/dms/directories`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Lỗi HTTP: ${response.status}`);
    }

    const result = await response.json();

    // ✅ Trả về mảng thư mục đúng cấu trúc (root_nodes)
    return Array.isArray(result.data) ? result.data : [];
  } catch (err) {
    console.error("❌ Lỗi khi tải cây thư mục:", err);
    return [];
  }
};
