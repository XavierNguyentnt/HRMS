import axiosInstance from "../../util/axios_instance";
import URL from "../../util/url";

// ============================
// TASKS
// ============================
// HÀM MỚI: Lấy tất cả các giai đoạn của task trong hệ thống
export const fetchAllTaskStages = async () => {
  const params = {
    model: "project.task.type", // Model của stage task
    method: "search_read",
    args: [[]], // Không có domain để lấy tất cả
    kwargs: {
      fields: ["id", "name", "sequence", "fold"],
      order: "sequence asc",
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
    throw new Error(error.message || "Lỗi tải tất cả các giai đoạn của task");
  }
};

// HÀM MỚI: Lấy tất cả các giai đoạn của task cho một dự án cụ thể (dùng cho Kanban)
export const fetchTaskStagesForProject = async (projectIds) => {
  const params = {
    model: "project.task.type", // Model của stage task
    method: "search_read",
    args: [[["project_ids", "in", projectIds]]],
    kwargs: {
      fields: ["id", "name", "sequence", "fold"],
      order: "sequence asc",
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
    throw new Error(error.message || "Lỗi tải các giai đoạn của task");
  }
};
export const fetchTasksByProject = async ({
  projectId,
  page = 1,
  pageSize = 10,
  domain = [], // Thêm domain để lọc
  order = "sequence, priority desc", // Thêm order để sắp xếp
}) => {
  const offset = (page - 1) * pageSize;
  const fullDomain = [["project_id", "=", projectId], ...domain]; // Kết hợp domain mặc định và domain truyền vào

  // 1. Lấy tổng số task với domain đã lọc
  const countParams = {
    model: "project.task",
    method: "search_count",
    args: [fullDomain],
    kwargs: {},
  };
  const countResponse = await axiosInstance.post(URL.RPC_CALL, {
    jsonrpc: "2.0",
    params: countParams,
  });
  if (countResponse.data.error)
    throw new Error(countResponse.data.error.data.message);
  const total = countResponse.data.result;

  // 2. Lấy danh sách task của trang hiện tại với domain và order
  const dataParams = {
    model: "project.task",
    method: "search_read",
    args: [fullDomain],
    kwargs: {
      // THAY ĐỔI: Mở rộng danh sách các trường ở đây
      fields: [
        "id",
        "name",
        "milestone_id",
        "partner_id",
        "parent_id", // Nhiệm vụ cha
        "user_ids",
        "allocated_hours",
        "effective_hours",
        "subtask_effective_hours",
        "total_hours_spent",
        "remaining_hours",
        "progress",
        "date_deadline",
        "activity_ids", // Hoạt động tiếp theo
        "my_activity_date_deadline", // Thời hạn của tôi
        "rating_last_text", // Đánh giá
        "tag_ids", // Thẻ
        "date_last_stage_update", // Cập nhật giai đoạn lần cuối
        "stage_id", // Giai đoạn
        "create_uid",
        "is_closed",
        "personal_stage_type_id", // Giai đoạn cá nhân
        "priority",
        "priority_level",
        "sequence",
      ],
      order: order,
      limit: pageSize,
      offset: offset,
    },
  };
  const dataResponse = await axiosInstance.post(URL.RPC_CALL, {
    jsonrpc: "2.0",
    params: dataParams,
  });
  if (dataResponse.data.error)
    throw new Error(dataResponse.data.error.data.message);

  // 3. Trả về cả danh sách task và tổng số
  return {
    tasks: dataResponse.data.result || [],
    total: total,
  };
};

export const fetchTaskById = async (taskId) => {
  const params = {
    model: "project.task",
    method: "read",
    args: [
      [taskId],
      [
        "id",
        "name",
        "user_id",
        "stage_id",
        "description",
        "date_deadline",
        "priority",
      ],
    ],
  };
  try {
    const response = await axiosInstance.post(URL.RPC_CALL, {
      jsonrpc: "2.0",
      params,
    });
    if (response.data.error) throw new Error(response.data.error.data.message);
    return response.data.result?.[0] || null;
  } catch (error) {
    if (error.response?.data?.error)
      throw new Error(error.response.data.error.data.message);
    throw new Error(error.message || "Lỗi tải chi tiết task");
  }
};

/**
 * Lấy TOÀN BỘ thông tin chi tiết của một nhiệm vụ để hiển thị trên trang chi tiết.
 * @param {number} taskId - ID của project.task
 * @returns {Promise<object>}
 */
export const fetchTaskDetails = async (taskId) => {
  const params = {
    model: "project.task",
    method: "read", // Dùng 'read' để lấy trực tiếp từ ID, rất hiệu quả
    args: [
      [taskId],
      // Liệt kê tất cả các trường cần thiết cho trang chi tiết, dựa trên mẫu Odoo
      [
        "name",
        "project_id",
        "user_ids",
        "portal_user_names",
        "partner_id", // Trong ngữ cảnh của bạn là "Người quản lý"
        "date_deadline",
        "description",
        "stage_id",
        "tag_ids",
        "milestone_id",
        "priority",
        "priority_level",
        "parent_id",
        "child_ids",
        "timesheet_ids",
        "is_closed", // Dùng để xác định icon Hoàn thành/Đang làm
        "create_uid", // Dùng để xác định người tạo task
        "active", // Dùng cho chức năng xóa mềm
        "message_follower_ids", // Dùng cho chatter
        "message_ids", // Dùng cho chatter
        "activity_ids", // Dùng cho chatter
      ],
    ],
    kwargs: {},
  };
  try {
    const response = await axiosInstance.post(URL.RPC_CALL, {
      jsonrpc: "2.0",
      params,
    });
    if (response.data.error) throw new Error(response.data.error.data.message);
    // 'read' trả về một mảng chứa một đối tượng duy nhất
    return response.data.result?.[0] || null;
  } catch (error) {
    if (error.response?.data?.error)
      throw new Error(error.response.data.error.data.message);
    throw new Error(error.message || "Lỗi khi tải chi tiết nhiệm vụ.");
  }
};

export const createTask = async (taskData) => {
  const params = {
    model: "project.task",
    method: "create",
    args: [taskData],
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
    if (error.response?.data?.error)
      throw new Error(error.response.data.error.data.message);
    throw new Error(error.message || "Lỗi tạo task");
  }
};

/**
 * Fetch task theo domain tùy chỉnh, hỗ trợ phân trang
 */
export const fetchTasksByDomain = async ({
  domain = [],
  page = 1,
  pageSize = 10,
  order = "date_deadline desc, priority desc",
}) => {
  const offset = (page - 1) * pageSize;

  const countParams = {
    model: "project.task",
    method: "search_count",
    args: [domain],
    kwargs: {},
  };
  const countResponse = await axiosInstance.post(URL.RPC_CALL, {
    jsonrpc: "2.0",
    params: countParams,
  });
  if (countResponse.data.error)
    throw new Error(countResponse.data.error.data.message);
  const total = countResponse.data.result;

  const dataParams = {
    model: "project.task",
    method: "search_read",
    args: [domain],
    kwargs: {
      fields: [
        "id",
        "name",
        "user_ids",
        "stage_id",
        "date_deadline",
        "project_id",
        "priority",
        "priority_level",
        "is_closed",
        "date_end",
      ],
      order: order,
      limit: pageSize,
      offset: offset,
    },
  };
  const dataResponse = await axiosInstance.post(URL.RPC_CALL, {
    jsonrpc: "2.0",
    params: dataParams,
  });
  if (dataResponse.data.error)
    throw new Error(dataResponse.data.error.data.message);

  return {
    tasks: dataResponse.data.result || [],
    total: total,
  };
};

export const updateTask = async (taskId, data) => {
  const params = {
    model: "project.task",
    method: "write",
    args: [[taskId], data],
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
    if (error.response?.data?.error)
      throw new Error(error.response.data.error.data.message);
    throw new Error(error.message || "Lỗi cập nhật task");
  }
};

//Archive task (Xoá nhiệm vụ / lưu trữ 30 ngày)

export const archiveTask = async (taskId) => {
  // Thực chất là gọi hàm update và set trường 'active' thành false
  return updateTask(taskId, { active: false });
};

//Restore task (Khôi phục nhiệm vụ đã xoá)
export const restoreTask = async (taskId) => {
  return updateTask(taskId, { active: true });
};

// Xoá task vĩnh viễn
export const deleteTask = async (taskId) => {
  const params = {
    model: "project.task",
    method: "unlink",
    args: [[taskId]],
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
    if (error.response?.data?.error)
      throw new Error(error.response.data.error.data.message);
    throw new Error(error.message || "Lỗi xóa task");
  }
};
