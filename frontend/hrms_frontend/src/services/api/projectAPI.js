import axiosInstance from "../../util/axios_instance";
import URL from "../../util/url";

/*========================*/
/*CÁC API QUẢN TRỊ CÔNG VIỆC*/
/*========================*/

// ============================
// PROJECTS
// ============================
/**
 * HÀM MỚI: Lấy chi tiết (tên, màu sắc) của các thẻ (tags) từ một danh sách ID.
 * Hàm này rất quan trọng để hiển thị các thẻ màu mè giống như Odoo.
 * @param {number[]} tagIds - Mảng các ID của project.tags
 * @returns {Promise<Array>} - Mảng các đối tượng tag, ví dụ: [{id: 1, name: 'Nội bộ', color: 9}]
 */

//FETCH TAGS

export const fetchAllTags = async () => {
  const params = {
    model: "project.tags",
    method: "search_read",
    args: [[]],
    kwargs: { fields: ["id", "name", "color"], order: "name asc" },
  };
  const response = await axiosInstance.post(URL.RPC_CALL, {
    jsonrpc: "2.0",
    params,
  });
  if (response.data.error) throw new Error(response.data.error.data.message);
  return response.data.result || [];
};

export const fetchTagsDetails = async (tagIds) => {
  // Nếu không có tagIds thì trả về mảng rỗng để tránh gọi API không cần thiết
  if (!tagIds || tagIds.length === 0) {
    return [];
  }
  const params = {
    model: "project.tags",
    method: "search_read",
    // Domain: tìm tất cả các tag có id nằm trong danh sách tagIds
    args: [[["id", "in", tagIds]]],
    kwargs: {
      fields: ["id", "name", "color"],
    },
  };
  try {
    const response = await axiosInstance.post(URL.RPC_CALL, {
      jsonrpc: "2.0",
      params,
    });
    if (response.data.error) {
      throw new Error(response.data.error.data.message);
    }
    return response.data.result || [];
  } catch (error) {
    console.error("Lỗi khi tải chi tiết tags:", error);
    // Trả về mảng rỗng để không làm crash giao diện nếu có lỗi
    return [];
  }
};

export const createTag = async (tagData) => {
  const params = {
    model: "project.tags",
    method: "create",
    args: [tagData], // {name: "Tên thẻ", color: 5}
    kwargs: {},
  };
  const response = await axiosInstance.post(URL.RPC_CALL, {
    jsonrpc: "2.0",
    params,
  });
  if (response.data.error) throw new Error(response.data.error.data.message);
  return response.data.result; // id tag mới
};

//FETCH PROJECTS

export const fetchProjects = async () => {
  const params = {
    model: "project.project",
    method: "search_read",
    args: [[]],
    kwargs: {
      fields: ["id", "name", "user_id", "date_start"],
      order: "date_start desc",
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
    if (error.response?.data?.error)
      throw new Error(error.response.data.error.data.message);
    throw new Error(error.message || "Lỗi tải danh sách dự án");
  }
};

/**
 * Lấy thông tin chi tiết của một dự án bằng ID.
 * @param {number} projectId - ID của project.project
 * @returns {Promise<object>}
 */
export const fetchProjectById = async (projectId) => {
  const params = {
    model: "project.project",
    method: "read", // Dùng 'read' hiệu quả hơn 'search_read' khi đã biết ID
    args: [
      [parseInt(projectId)], // 'read' yêu cầu mảng các ID
      [
        // Liệt kê các trường bạn cần cho trang chi tiết
        "name",
        "user_id",
        "partner_id",
        "date_start",
        "date",
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
    if (response.data.result && response.data.result.length > 0) {
      return response.data.result[0];
    }
    throw new Error("Không tìm thấy dự án.");
  } catch (error) {
    console.error("Lỗi khi tải chi tiết dự án:", error);
    throw error;
  }
};

// NÂNG CẤP: Chấp nhận domain và order để tìm kiếm, lọc, sắp xếp
export const fetchProjectsWithDetail = async ({
  domain = [],
  order = "date_start desc",
}) => {
  try {
    const projectsParams = {
      model: "project.project",
      method: "search_read",
      args: [[["user_id", "!=", 1], ...domain]], // Kết hợp domain mặc định và domain từ tham số
      kwargs: {
        fields: [
          "id",
          "name",
          "is_favorite",
          "partner_id",
          "company_id",
          "date_start",
          "date",
          "allocated_hours",
          "effective_hours",
          "remaining_hours",
          "milestone_progress",
          "next_milestone_id",
          "user_id",
          "tag_ids",
          "last_update_status",
          "last_update_color",
          "stage_id",
        ],
        order: order, // Sử dụng tham số order
      },
    };

    const response = await axiosInstance.post(URL.RPC_CALL, {
      jsonrpc: "2.0",
      params: projectsParams,
    });

    if (response.data.error) throw new Error(response.data.error.data.message);

    const projects = response.data.result || [];
    if (projects.length === 0) return [];

    const allTagIds = [...new Set(projects.flatMap((p) => p.tag_ids || []))];
    const tagsDetails = await fetchTagsDetails(allTagIds);
    const tagsMap = new Map(tagsDetails.map((tag) => [tag.id, tag]));

    return projects.map((proj) => ({
      id: proj.id,
      display_name: proj.name || "Không tên",
      user_id: proj.user_id || [0, "Chưa gán"],
      partner_id: proj.partner_id || [0, "N/A"],
      company_id: proj.company_id || [0, "N/A"],
      planned_date: `${proj.date_start || ""} → ${proj.date || ""}`.replace(
        /^ → | → $/g,
        ""
      ),
      milestone_progress: proj.milestone_progress || 0,
      allocated_hours: proj.allocated_hours || 0,
      effective_hours: proj.effective_hours || 0,
      remaining_hours: proj.remaining_hours || 0,
      tags: (proj.tag_ids || [])
        .map((id) => tagsMap.get(id))
        .filter(Boolean)
        .map((tag) => ({
          id: tag.id,
          name: tag.name || "Không tên",
          color: tag.color ?? 0,
        })),
      status: {
        name: proj.last_update_status || "N/A",
        color: proj.last_update_color ?? 0,
      },
      stage_id: proj.stage_id || [0, "Chưa xác định"],
    }));
  } catch (error) {
    console.error("fetchProjectsWithDetail error:", error);
    throw new Error(error.message || "Lỗi tải danh sách dự án");
  }
};

//FETCH STAGES

export async function fetchAllProjectStages() {
  const params = {
    model: "project.project.stage", // đúng model stage của Project
    method: "search_read",
    args: [[]],
    kwargs: {
      fields: ["id", "name", "sequence"], // bỏ "color"
      order: "sequence ASC",
    },
  };
  const response = await axiosInstance.post(URL.RPC_CALL, {
    jsonrpc: "2.0",
    params,
  });
  if (response.data.error) throw new Error(response.data.error.data.message);
  return response.data.result || [];
}

export const fetchStagesDetails = async (stageIds) => {
  if (!stageIds || stageIds.length === 0) return [];
  const params = {
    model: "project.project.stage",
    method: "search_read",
    args: [[["id", "in", stageIds]]],
    kwargs: { fields: ["id", "name", "color"] },
  };
  const response = await axiosInstance.post(URL.RPC_CALL, {
    jsonrpc: "2.0",
    params,
  });
  return response.data.result || [];
};

export const createProject = async (projectData) => {
  const params = {
    model: "project.project",
    method: "create",
    args: [projectData],
    kwargs: {}, // luôn có kwargs
  };
  try {
    const response = await axiosInstance.post(URL.RPC_CALL, {
      jsonrpc: "2.0",
      params,
    });
    if (response.data.error) throw new Error(response.data.error.data.message);
    return response.data.result; // trả về ID của project mới
  } catch (error) {
    if (error.response?.data?.error)
      throw new Error(error.response.data.error.data.message);
    throw new Error(error.message || "Lỗi tạo dự án");
  }
};

/* CHỈNH SỬA THÔNG TIN DỰ ÁN */

export const updateProject = async (projectId, data) => {
  const params = {
    model: "project.project",
    method: "write",
    args: [[projectId], data],
    kwargs: {},
  };
  try {
    const response = await axiosInstance.post(URL.RPC_CALL, {
      jsonrpc: "2.0",
      params,
    });
    if (response.data.error) throw new Error(response.data.error.data.message);
    return response.data.result; // true nếu thành công
  } catch (error) {
    throw new Error(error.message || "Lỗi cập nhật dự án");
  }
};

// Xóa dự án theo ID
export const deleteProject = async (projectId) => {
  const params = {
    model: "project.project",
    method: "unlink",
    args: [[projectId]], // unlink yêu cầu mảng ID
    kwargs: {},
  };
  try {
    const response = await axiosInstance.post(URL.RPC_CALL, {
      jsonrpc: "2.0",
      params,
    });
    if (response.data.error) throw new Error(response.data.error.data.message);
    return response.data.result; // Odoo trả về true nếu xóa thành công
  } catch (error) {
    console.error("Lỗi khi xóa dự án:", error);
    throw error;
  }
};
