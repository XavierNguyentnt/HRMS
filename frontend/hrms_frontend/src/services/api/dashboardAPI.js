// src/services/api/dashboardAPI.js
import axiosInstance from "../../util/axios_instance";
import URL from "../../util/url";
import { format, subMonths, startOfMonth, getMonth, getYear } from "date-fns";
import { ROLES } from "../../contexts/AuthContext"; // Import ROLES để so sánh

/**
 * Xây dựng domain lọc dựa trên vai trò của người dùng.
 * @param {string} role - Vai trò của người dùng (từ ROLES).
 * @param {number} userId - ID của người dùng hiện tại.
 * @returns {Array} - Mảng domain của Odoo.
 */
const buildUserDomain = (role, userId, model = "project") => {
  if (role === ROLES.ADMIN || role === ROLES.MANAGER) {
    return []; // Admin và Manager có thể xem tất cả
  }
  // Staff chỉ xem được những gì liên quan đến họ
  if (model === "project") {
    // Lọc các dự án mà người dùng là trưởng dự án HOẶC có task được giao
    return [
      "|",
      ["user_id", "=", userId],
      ["task_ids.user_ids", "in", [userId]],
    ];
  }
  if (model === "task") {
    // Lọc các task mà người dùng được giao HOẶC do họ tạo
    return ["|", ["user_ids", "in", [userId]], ["create_uid", "=", userId]];
  }
  return [];
};

/**
 * Lấy các số liệu thống kê chính (KPIs) cho Dashboard.
 * ĐÃ CẬP NHẬT PHÂN QUYỀN
 */
export const getDashboardStats = async (role, userId) => {
  const projectModel = "project.project";
  const taskModel = "project.task";
  const today = format(new Date(), "yyyy-MM-dd HH:mm:ss");

  const projectDomain = buildUserDomain(role, userId, "project");
  const taskDomain = buildUserDomain(role, userId, "task");

  const calls = {
    totalProjects: {
      model: projectModel,
      method: "search_count",
      args: [projectDomain],
      kwargs: {},
    },
    completedProjects: {
      model: projectModel,
      method: "search_count",
      args: [[...projectDomain, ["is_closed", "=", true]]],
      kwargs: {},
    },
    inProgressProjects: {
      model: projectModel,
      method: "search_count",
      args: [[...projectDomain, ["is_closed", "=", false]]],
      kwargs: {},
    },
    totalTasks: {
      model: taskModel,
      method: "search_count",
      args: [taskDomain],
      kwargs: {},
    },
    completedTasks: {
      model: taskModel,
      method: "search_count",
      args: [[...taskDomain, ["is_closed", "=", true]]],
      kwargs: {},
    },
    overdueTasks: {
      model: taskModel,
      method: "search_count",
      args: [
        [
          ...taskDomain,
          ["date_deadline", "<", today],
          ["is_closed", "=", false],
        ],
      ],
      kwargs: {},
    },
  };

  const results = await Promise.all(
    Object.values(calls).map((call) =>
      axiosInstance.post(URL.RPC_CALL, { jsonrpc: "2.0", params: call })
    )
  );

  const [
    totalProjectsRes,
    completedProjectsRes,
    inProgressProjectsRes,
    totalTasksRes,
    completedTasksRes,
    overdueTasksRes,
  ] = results;

  return {
    totalProjects: totalProjectsRes.data.result || 0,
    completedProjects: completedProjectsRes.data.result || 0,
    inProgressProjects: inProgressProjectsRes.data.result || 0,
    totalTasks: totalTasksRes.data.result || 0,
    completedTasks: completedTasksRes.data.result || 0,
    overdueTasks: overdueTasksRes.data.result || 0,
  };
};

/**
 * Lấy dữ liệu tiến độ cá nhân của người dùng.
 */
export const getMyProgress = async (userId) => {
  if (!userId) return { completed: 0, inProgress: 0, notStarted: 0 };
  const domain = [["user_ids", "in", [userId]]];
  const calls = {
    completed: {
      model: "project.task",
      method: "search_count",
      args: [[...domain, ["is_closed", "=", true]]],
      kwargs: {},
    },
    inProgress: {
      model: "project.task",
      method: "search_count",
      args: [
        [...domain, ["is_closed", "=", false], ["stage_id.fold", "=", false]],
      ],
      kwargs: {},
    },
    notStarted: {
      model: "project.task",
      method: "search_count",
      args: [[...domain, ["is_closed", "=", false], ["sequence", "=", 0]]],
      kwargs: {},
    },
  };

  const [completedRes, inProgressRes, notStartedRes] = await Promise.all(
    Object.values(calls).map((call) =>
      axiosInstance.post(URL.RPC_CALL, { jsonrpc: "2.0", params: call })
    )
  );

  return {
    completed: completedRes.data.result || 0,
    inProgress: inProgressRes.data.result || 0,
    notStarted: notStartedRes.data.result || 0,
  };
};

/**
 * Lấy danh sách các công việc của tôi.
 */
export const getMyTasks = async (userId, limit = 5) => {
  if (!userId) return [];
  const params = {
    model: "project.task",
    method: "search_read",
    args: [
      [
        ["user_ids", "in", [userId]],
        ["is_closed", "=", false],
      ],
    ],
    kwargs: {
      fields: ["id", "name", "date_deadline", "project_id", "priority"],
      limit: limit,
      order: "date_deadline asc, priority desc",
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
 * Lấy dữ liệu phân tích dự án theo thời gian (6 tháng gần nhất).
 */
export const getProjectAnalysisData = async (role, userId, months = 6) => {
  const projectModel = "project.project";
  const lastSixMonths = [];
  const today = new Date();

  for (let i = 0; i < months; i++) {
    const date = subMonths(today, i);
    lastSixMonths.unshift({
      month: getMonth(date),
      year: getYear(date),
      created: 0,
      completed: 0,
    });
  }

  const startDate = format(
    startOfMonth(subMonths(today, months - 1)),
    "yyyy-MM-dd HH:mm:ss"
  );
  const projectDomain = buildUserDomain(role, userId, "project");

  // Lấy tất cả dự án hợp lệ từ đầu 6 tháng trước đến nay
  const projects = await axiosInstance
    .post(URL.RPC_CALL, {
      jsonrpc: "2.0",
      params: {
        model: projectModel,
        method: "search_read",
        // Thêm domain phân quyền vào đây
        args: [[...projectDomain, ["create_date", ">=", startDate]]],
        kwargs: {
          fields: ["create_date", "date_last_stage_update", "is_closed"],
        },
      },
    })
    .then((res) => res.data.result || []);

  // Xử lý dữ liệu ở client
  for (const project of projects) {
    const createDate = new Date(project.create_date);
    const createMonth = getMonth(createDate);
    const createYear = getYear(createDate);

    const monthData = lastSixMonths.find(
      (m) => m.month === createMonth && m.year === createYear
    );
    if (monthData) {
      monthData.created++;
    }

    if (project.is_closed && project.date_last_stage_update) {
      const completedDate = new Date(project.date_last_stage_update);
      const completedMonth = getMonth(completedDate);
      const completedYear = getYear(completedDate);
      const completedMonthData = lastSixMonths.find(
        (m) => m.month === completedMonth && m.year === completedYear
      );
      if (completedMonthData) {
        completedMonthData.completed++;
      }
    }
  }
  return lastSixMonths;
};

/**
 * Lấy dữ liệu hiệu suất của nhóm.
 */
export const getTeamPerformanceData = async () => {
  // 1. Lấy danh sách tất cả người dùng
  const usersRes = await axiosInstance.post(URL.RPC_CALL, {
    jsonrpc: "2.0",
    params: {
      model: "res.users",
      method: "search_read",
      args: [[["share", "=", false]]],
      kwargs: { fields: ["id", "name"] },
    },
  });
  const users = usersRes.data.result || [];
  const userMap = new Map(
    users.map((u) => [u.id, { ...u, total: 0, completed: 0 }])
  );

  // 2. Dùng read_group để đếm tổng số task cho mỗi người
  const totalTasksRes = await axiosInstance.post(URL.RPC_CALL, {
    jsonrpc: "2.0",
    params: {
      model: "project.task",
      method: "read_group",
      args: [[["user_ids", "!=", false]], ["user_ids"], ["user_ids"]],
      kwargs: { lazy: false },
    },
  });
  (totalTasksRes.data.result || []).forEach((group) => {
    if (userMap.has(group.user_ids[0])) {
      userMap.get(group.user_ids[0]).total = group.user_ids_count;
    }
  });

  // 3. Dùng read_group để đếm task đã hoàn thành cho mỗi người
  const completedTasksRes = await axiosInstance.post(URL.RPC_CALL, {
    jsonrpc: "2.0",
    params: {
      model: "project.task",
      method: "read_group",
      args: [
        [
          ["user_ids", "!=", false],
          ["is_closed", "=", true],
        ],
        ["user_ids"],
        ["user_ids"],
      ],
      kwargs: { lazy: false },
    },
  });
  (completedTasksRes.data.result || []).forEach((group) => {
    if (userMap.has(group.user_ids[0])) {
      userMap.get(group.user_ids[0]).completed = group.user_ids_count;
    }
  });

  return Array.from(userMap.values());
};
