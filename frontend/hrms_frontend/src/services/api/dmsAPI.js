// src/services/api/dmsAPI.js
import axiosInstance from "../../utils/axios_instance";
import URL from "../../utils/url";

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
export const fetchDocuments = async (
  filters = [],
  limit = 100,
  sort = "create_date desc"
) => {
  try {
    const fileParams = {
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
        order: sort,
        limit,
        context: { lang: "vi_VN" },
      },
    };
    const fileResponse = await axiosInstance.post(URL.RPC_CALL, {
      jsonrpc: "2.0",
      params: fileParams,
    });
    if (fileResponse.data.error)
      throw new Error(fileResponse.data.error.data.message);
    const docs = fileResponse.data.result || [];
    const attachmentIds = docs
      .filter((doc) => !doc.human_size && doc.attachment_id)
      .map((doc) => doc.attachment_id[0]);

    if (attachmentIds.length === 0) return docs;

    const sizeParams = {
      model: "ir.attachment",
      method: "search_read",
      args: [[["id", "in", attachmentIds]]],
      kwargs: { fields: ["id", "file_size"] },
    };
    const sizeResponse = await axiosInstance.post(URL.RPC_CALL, {
      jsonrpc: "2.0",
      params: sizeParams,
    });
    if (sizeResponse.data.error)
      throw new Error(sizeResponse.data.error.data.message);
    const sizes = sizeResponse.data.result || [];

    const sizeMap = new Map();
    sizes.forEach((sizeInfo) => sizeMap.set(sizeInfo.id, sizeInfo.file_size));

    const finalDocs = docs.map((doc) => {
      if (doc.human_size) return doc;
      const attachmentId = doc.attachment_id ? doc.attachment_id[0] : null;
      if (attachmentId && sizeMap.has(attachmentId)) {
        const fileSize = sizeMap.get(attachmentId);
        return { ...doc, size: fileSize, human_size: humanFileSize(fileSize) };
      }
      return { ...doc, size: 0, human_size: "0 B" };
    });
    return finalDocs;
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

/**
 * Lấy các thư mục con trực tiếp của một thư mục cha
 */
export const fetchSubDirectories = async (parentId) => {
  const domain = [["parent_id", "=", parentId === null ? false : parentId]];

  const params = {
    model: "dms.directory",
    method: "search_read",
    args: [domain],
    kwargs: {
      fields: ["id", "name", "complete_name"],
      order: "name asc",
    },
  };
  try {
    const response = await axiosInstance.post(URL.RPC_CALL, {
      jsonrpc: "2.0",
      params,
    });
    if (response.data.error) throw new Error(response.data.error.data.message);
    return response.data.result || [];
  } catch (err) {
    console.error(`❌ Lỗi khi tải thư mục con của ${parentId}:`, err);
    return [];
  }
};

/*GET DIRECTORIES TREE*/
export const fetchDirectories = async () => {
  const params = {
    model: "dms.directory",
    method: "search_read",
    args: [[]], // Lấy tất cả thư mục
    kwargs: {
      fields: ["id", "name", "parent_id", "complete_name"],
      order: "complete_name asc",
      context: { lang: "vi_VN" },
    },
  };

  try {
    const response = await axiosInstance.post(URL.RPC_CALL, {
      jsonrpc: "2.0",
      params,
    });
    if (response.data.error) throw new Error(response.data.error.data.message);

    const flatDirs = response.data.result || [];
    // 👇 Chuyển hàm buildTree vào đây
    const buildTree = (items) => {
      const map = new Map();
      const roots = [];
      items.forEach((item) => {
        map.set(item.id, { ...item, children: [] });
      });
      map.forEach((item) => {
        const parentId = item.parent_id ? item.parent_id[0] : null;
        if (parentId && map.has(parentId)) {
          map.get(parentId).children.push(item);
        } else {
          roots.push(item);
        }
      });
      return roots;
    };
    return buildTree(flatDirs);
  } catch (err) {
    console.error("❌ Lỗi khi tải cây thư mục:", err);
    return [];
  }
};

/**
 * Lấy các file con trực tiếp của một thư mục
 */
export const fetchImmediateFiles = async (directoryId) => {
  const domain = directoryId
    ? [["directory_id", "=", directoryId]]
    : [["directory_id", "=", false]];

  const params = {
    model: "dms.file",
    method: "search_read",
    args: [domain],
    kwargs: {
      fields: [
        "id",
        "name",
        "directory_id",
        "human_size",
        "path_names",
        "icon_url",
        "access_url",
      ],
      order: "name asc",
    },
  };

  try {
    const response = await axiosInstance.post(URL.RPC_CALL, {
      jsonrpc: "2.0",
      params,
    });
    if (response.data.error) throw new Error(response.data.error.data.message);
    return response.data.result || [];
  } catch (err) {
    console.error(
      `❌ Lỗi khi tải file trực tiếp của thư mục ${directoryId}:`,
      err
    );
    return [];
  }
};

/**
 * Tạo một thư mục mới
 */
export const createDirectory = async (name, parentId = false) => {
  const params = {
    model: "dms.directory",
    method: "create",
    args: [{ name, parent_id: parentId }],
    kwargs: {},
  };
  try {
    const response = await axiosInstance.post(URL.RPC_CALL, {
      jsonrpc: "2.0",
      params,
    });
    if (response.data.error) throw new Error(response.data.error.data.message);
    return response.data.result;
  } catch (error) {
    console.error("❌ Lỗi khi tạo thư mục:", error);
    throw error;
  }
};

/**
 * Sao chép một file hoặc thư mục sang vị trí mới
 * @returns {Promise<number>} ID của mục mới được tạo.
 */
export const copyItem = async (model, id, newParentId, newName) => {
  // Tên trường cần ghi đè: 'directory_id' cho file, 'parent_id' cho thư mục
  const fieldToUpdate = model === "dms.file" ? "directory_id" : "parent_id";

  const defaultValues = {
    [fieldToUpdate]: newParentId,
  };

  // Nếu có tên mới được cung cấp, thêm nó vào các giá trị ghi đè
  if (newName) {
    defaultValues.name = newName;
  }

  const params = {
    model: model,
    method: "copy", // Sử dụng phương thức 'copy' của Odoo
    args: [
      [id], // ID của bản ghi gốc cần sao chép
      defaultValues, // Giá trị mới cho thư mục cha và tên
    ],
    kwargs: {},
  };
  try {
    const response = await axiosInstance.post(URL.RPC_CALL, {
      jsonrpc: "2.0",
      params,
    });
    if (response.data.error) throw new Error(response.data.error.data.message);
    const result = response.data.result;
    if (Array.isArray(result) && result.length > 0) {
      return result[0]; // Lấy phần tử đầu tiên
    }
    return result; // Trả về kết quả (có thể là một số nguyên)
  } catch (error) {
    console.error(`❌ Lỗi khi sao chép ${model} ID ${id}:`, error);
    throw error;
  }
};

/**
 * Di chuyển một file hoặc thư mục
 */
export const moveItem = async (model, id, newParentId) => {
  // Di chuyển file là thay đổi 'directory_id', di chuyển thư mục là thay đổi 'parent_id'
  const fieldToUpdate = model === "dms.file" ? "directory_id" : "parent_id";

  const params = {
    model: model,
    method: "write",
    args: [[id], { [fieldToUpdate]: newParentId }],
    kwargs: {},
  };
  try {
    const response = await axiosInstance.post(URL.RPC_CALL, {
      jsonrpc: "2.0",
      params,
    });
    if (response.data.error) throw new Error(response.data.error.data.message);
    return response.data.result;
  } catch (error) {
    console.error(`❌ Lỗi khi di chuyển ${model} ID ${id}:`, error);
    throw error;
  }
};

/**
 * Đổi tên một file hoặc thư mục
 */
export const renameItem = async (model, id, newName) => {
  const params = {
    model: model, // 'dms.file' hoặc 'dms.directory'
    method: "write",
    args: [[id], { name: newName }],
    kwargs: {},
  };
  try {
    const response = await axiosInstance.post(URL.RPC_CALL, {
      jsonrpc: "2.0",
      params,
    });
    if (response.data.error) throw new Error(response.data.error.data.message);
    return response.data.result;
  } catch (error) {
    console.error(`❌ Lỗi khi đổi tên ${model} ID ${id}:`, error);
    throw error;
  }
};

// /**
//  * Xóa một file hoặc thư mục
//  */
// export const deleteItem = async (model, id) => {
//   const params = {
//     model: model, // 'dms.file' hoặc 'dms.directory'
//     method: "unlink",
//     args: [[id]],
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
//     console.error(`❌ Lỗi khi xóa ${model} ID ${id}:`, error);
//     throw error;
//   }
// };

/**
 * Lấy danh sách các THƯ MỤC CON TRỰC TIẾP của một thư mục cha.
 * Dùng cho Modal Di chuyển.
 * @param {number|false} parentId - ID của thư mục cha, hoặc false để lấy các thư mục gốc.
 */
export const fetchSubFolders = async (parentId = false) => {
  const domain = [["parent_id", "=", parentId]];
  const params = {
    model: "dms.directory",
    method: "search_read",
    args: [domain],
    kwargs: {
      fields: ["id", "name", "complete_name"],
      order: "name asc",
    },
  };
  try {
    const response = await axiosInstance.post(URL.RPC_CALL, {
      jsonrpc: "2.0",
      params,
    });
    if (response.data.error) throw new Error(response.data.error.data.message);
    return response.data.result || [];
  } catch (err) {
    console.error(`❌ Lỗi khi tải thư mục con của ${parentId}:`, err);
    return [];
  }
};

/* TRASHBIN */

/**
 * 🗑️ Lấy danh sách các file đã xóa mềm (active=false)
 */
export const fetchTrashedItems = async () => {
  const context = { active_test: false };
  try {
    // 🗂️ Lấy file bị xóa
    const fileParams = {
      model: "dms.file",
      method: "search_read",
      args: [[["active", "=", false]]],
      kwargs: {
        fields: ["id", "name", "directory_id", "write_date"],
        context,
      },
    };
    const fileRes = await axiosInstance.post(URL.RPC_CALL, {
      jsonrpc: "2.0",
      params: fileParams,
    });
    if (fileRes.data.error) throw new Error(fileRes.data.error.data.message);
    const files = (fileRes.data.result || []).map((f) => ({
      ...f,
      type: "file",
    }));

    // 📁 Lấy thư mục bị xóa
    const dirParams = {
      model: "dms.directory",
      method: "search_read",
      args: [[["active", "=", false]]],
      kwargs: {
        fields: ["id", "name", "parent_id", "write_date"],
        context,
      },
    };
    const dirRes = await axiosInstance.post(URL.RPC_CALL, {
      jsonrpc: "2.0",
      params: dirParams,
    });
    if (dirRes.data.error) throw new Error(dirRes.data.error.data.message);
    const dirs = (dirRes.data.result || []).map((d) => ({
      ...d,
      type: "directory",
    }));

    return [...dirs, ...files];
  } catch (error) {
    console.error("❌ Lỗi khi tải thùng rác:", error);
    throw new Error("Không thể tải danh sách thùng rác.");
  }
};

/**
 * Xóa mềm nếu có active, fallback sang unlink nếu không
 */
export const deleteItem = async (model, id) => {
  try {
    const params = {
      model,
      method: "write",
      args: [[id], { active: false }],
      kwargs: { context: { active_test: false } },
    };
    const res = await axiosInstance.post(URL.RPC_CALL, {
      jsonrpc: "2.0",
      params,
    });
    if (res.data.error) {
      const msg = res.data.error.data.message;
      if (msg.includes("Invalid field") && msg.includes("active")) {
        console.warn(`⚠️ ${model} không hỗ trợ active → dùng unlink`);
        const unlinkParams = {
          model,
          method: "unlink",
          args: [[id]],
          kwargs: {},
        };
        const unlinkRes = await axiosInstance.post(URL.RPC_CALL, {
          jsonrpc: "2.0",
          params: unlinkParams,
        });
        if (unlinkRes.data.error)
          throw new Error(unlinkRes.data.error.data.message);
        return unlinkRes.data.result;
      }
      throw new Error(msg);
    }
    return res.data.result;
  } catch (err) {
    console.error(`❌ Lỗi khi xóa ${model} ID ${id}:`, err);
    throw err;
  }
};

/**
 * 🔁 Khôi phục các file đã bị xóa mềm
 * Đặt lại active=true và nếu có thể, khôi phục vào thư mục cũ
 */
export const restoreDocumentsAndDirectories = async (itemIds = []) => {
  if (itemIds.length === 0) return;

  // Context để khôi phục: cần active_test: false để search/restore item bị xóa
  const restoreContext = { active_test: false };

  try {
    const params = {
      model: "dms.file", // Tên model bất kỳ (hoặc dms.file)
      method: "restore", // ✅ Gọi hàm restore trên model
      args: [itemIds], // Truyền danh sách ID cần khôi phục
      kwargs: { context: restoreContext }, // Truyền context
    };

    const res = await axiosInstance.post(URL.RPC_CALL, {
      jsonrpc: "2.0",
      params: params,
    });

    if (res.data.error) {
      // Dòng này cần được kiểm tra kỹ
      const errorMessage =
        res.data.error.data?.message ||
        res.data.error.message ||
        "Lỗi không xác định.";
      // ✅ Cập nhật console log để hiển thị lỗi rõ ràng hơn
      console.error(`❌ Lỗi khôi phục: ${errorMessage}`);
      throw new Error(errorMessage);
    }
    return res.data.result;
  } catch (error) {
    // ✅ Dòng 644 của bạn: Lỗi khôi phục undefined
    console.error(`Lỗi khôi phục ${itemIds}: ${error}`);
    throw error;
  }
};

/**
 * Xóa vĩnh viễn các mục đã chọn (file và directory).
 * @param {object} idsByModel - Object chứa các mảng ID đã nhóm theo model:
 * { 'dms.file': [ids], 'dms.directory': [ids] }
 */
export const deletePermanently = async (idsByModel) => {
  // (Khoảng dòng 694)
  // Context để kích hoạt xóa cứng (force_unlink: true)
  const deleteContext = { active_test: false, force_unlink: true };
  let errorMessages = [];

  for (const model in idsByModel) {
    const ids = idsByModel[model];
    if (ids && ids.length > 0) {
      const delParams = {
        model, // dms.file HOẶC dms.directory
        method: "unlink",
        args: [ids], // List ID chỉ chứa ID của model tương ứng
        kwargs: { context: deleteContext },
      };

      try {
        const delRes = await axiosInstance.post(URL.RPC_CALL, {
          jsonrpc: "2.0",
          params: delParams,
        });

        if (delRes.data.error) {
          throw new Error(delRes.data.error.data.message);
        }
      } catch (error) {
        console.error(`Lỗi khi xóa model ${model}:`, error);
        errorMessages.push(
          `Lỗi khi xóa ${model}: ${error.message || "Lỗi không xác định"}`
        );
      }
    }
  }

  if (errorMessages.length > 0) {
    throw new Error(
      `Đã xảy ra lỗi trong quá trình xóa: \n${errorMessages.join("\n")}`
    );
  }
  return true;
};

/**
 * Kiểm tra sự tồn tại của các tên file trong một thư mục đích.
 * @param {number|false} directoryId ID của thư mục đích.
 * @param {string[]} names Danh sách các tên file cần kiểm tra.
 * @returns {Promise<string[]>} Một mảng chứa các tên file đã tồn tại.
 */
export const checkExistingFiles = async (directoryId, names) => {
  if (!names || names.length === 0) {
    return [];
  }
  const domain = [
    ["directory_id", "=", directoryId],
    ["name", "in", names],
  ];
  const params = {
    model: "dms.file",
    method: "search_read",
    args: [domain],
    kwargs: { fields: ["name"] },
  };
  try {
    const response = await axiosInstance.post(URL.RPC_CALL, {
      jsonrpc: "2.0",
      params,
    });
    if (response.data.error) throw new Error(response.data.error.data.message);
    return (response.data.result || []).map((file) => file.name);
  } catch (error) {
    console.error("❌ Lỗi khi kiểm tra file tồn tại:", error);
    throw error;
  }
};

/**
 * 🧹 Dọn sạch toàn bộ file trong thùng rác
 * (Xóa vĩnh viễn các bản ghi active=false)
 */
export const emptyTrash = async () => {
  // ✅ Context cho search_read (chỉ cần active_test=false để thấy các bản ghi đã xóa)
  const searchContext = { active_test: false };
  // ✅ Context cho unlink (cần force_unlink=true để xóa cứng)
  const deleteContext = { active_test: false, force_unlink: true };

  try {
    const models = ["dms.file", "dms.directory"];
    for (const model of models) {
      // Lấy danh sách bị xóa
      const searchParams = {
        model,
        method: "search_read",
        args: [[["active", "=", false]]],
        // ⚠️ Dùng searchContext để tránh lỗi 6 arguments
        kwargs: { fields: ["id"], context: searchContext },
      };
      const res = await axiosInstance.post(URL.RPC_CALL, {
        jsonrpc: "2.0",
        params: searchParams,
      });
      if (res.data.error) throw new Error(res.data.error.data.message);

      const rawIds = (res.data.result || []).map((r) => r.id);
      // ✅ FIX: Lọc để chỉ giữ lại các ID là số nguyên dương hợp lệ
      const ids = rawIds.filter((id) => Number.isInteger(id) && id > 0);

      if (ids.length > 0) {
        const delParams = {
          model,
          method: "unlink",
          args: [ids],
          // ⚠️ Dùng deleteContext để kích hoạt xóa cứng
          kwargs: { context: deleteContext },
        };
        const delRes = await axiosInstance.post(URL.RPC_CALL, {
          jsonrpc: "2.0",
          params: delParams,
        });
        if (delRes.data.error) throw new Error(delRes.data.error.data.message);
      }
    }
    console.log("✅ Đã dọn sạch thùng rác thành công.");
    return { success: true, message: "Đã dọn sạch thùng rác." };
  } catch (error) {
    console.error("❌ Lỗi khi dọn sạch thùng rác:", error);
    throw error;
  }
};
