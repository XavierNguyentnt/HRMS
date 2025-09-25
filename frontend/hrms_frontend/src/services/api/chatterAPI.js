import axiosInstance from "../../util/axios_instance";
import URL from "../../util/url";

//MESSAGE & CHATTER APIS

/**
 * Lấy chi tiết các tin nhắn (mail.message) từ một danh sách ID.
 * @param {number[]} messageIds - Mảng các ID của mail.message
 * @returns {Promise<Array>} - Mảng các đối tượng tin nhắn chi tiết
 */
export const fetchMessages = async (messageIds) => {
  if (!messageIds || messageIds.length === 0) {
    return [];
  }
  const params = {
    model: "mail.message",
    method: "search_read",
    args: [[["id", "in", messageIds]]],
    kwargs: {
      fields: [
        "id",
        "body",
        "date",
        "author_id", // [id, name]
        "message_type", // 'comment', 'notification', ...
        "subtype_id", // [id, name]
        "attachment_ids",
      ],
      order: "date asc", // Sắp xếp từ cũ nhất đến mới nhất
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
    console.error("Lỗi khi tải tin nhắn chatter:", err);
    throw err;
  }
};
/**
 * Lấy chi tiết của những người theo dõi (mail.followers) từ ID của họ.
 * @param {number[]} followerIds - Mảng các ID của mail.followers
 */
export const fetchFollowers = async (followerIds) => {
  if (!followerIds || followerIds.length === 0) return [];
  const params = {
    model: "mail.followers",
    method: "read",
    args: [followerIds, ["id", "partner_id"]],
    kwargs: {},
  };
  const response = await axiosInstance.post(URL.RPC_CALL, {
    jsonrpc: "2.0",
    params,
  });
  if (response.data.error) throw new Error(response.data.error.data.message);
  return response.data.result || [];
};

/**
 * Thêm người theo dõi vào một task.
 * @param {number} taskId - ID của task
 * @param {number[]} partnerIds - Mảng các partner_id cần thêm
 */
export const followTask = async (taskId, partnerIds) => {
  const params = {
    model: "project.task",
    method: "message_subscribe",
    args: [[taskId], partnerIds],
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
 * Hủy theo dõi một task.
 * @param {number} taskId - ID của task
 * @param {number[]} partnerIds - Mảng các partner_id cần xóa
 */
export const unfollowTask = async (taskId, partnerIds) => {
  const params = {
    model: "project.task",
    method: "message_unsubscribe",
    args: [[taskId], partnerIds],
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
 * Tạo một file đính kèm mới.
 * @param {object} attachmentData - { name, datas, res_model, res_id }
 */
export const createAttachment = async (attachmentData) => {
  const params = {
    model: "ir.attachment",
    method: "create",
    args: [attachmentData],
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
 * Lấy chi tiết các file đính kèm (ir.attachment) từ danh sách ID.
 * @param {number[]} attachmentIds - Mảng các ID của ir.attachment
 */
export const fetchAttachmentDetails = async (attachmentIds) => {
  if (!attachmentIds || attachmentIds.length === 0) return [];
  const params = {
    model: "ir.attachment",
    method: "read",
    args: [attachmentIds, ["id", "name", "mimetype"]],
    kwargs: {},
  };
  const response = await axiosInstance.post(URL.RPC_CALL, {
    jsonrpc: "2.0",
    params,
  });
  if (response.data.error) throw new Error(response.data.error.data.message);
  return response.data.result || [];
};

/**
 * Lấy dữ liệu ảnh (Avatar) dưới dạng base64 từ một URL của Odoo.
 * @param {string} url - Đường dẫn tương đối của ảnh, ví dụ: /web/image/res.partner/3/avatar_128
 * @returns {Promise<string|null>} - Chuỗi base64 của ảnh hoặc null nếu lỗi.
 */
export const fetchBase64Image = async (url) => {
  try {
    const response = await axiosInstance.get(url, {
      responseType: "arraybuffer",
    });
    const base64 = btoa(
      new Uint8Array(response.data).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ""
      )
    );
    const contentType = response.headers["content-type"].toLowerCase();
    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.error(`Không thể tải ảnh từ ${url}`, error);
    return null;
  }
};
