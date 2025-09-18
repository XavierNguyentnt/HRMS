const URL = {
  // THÊM /api/ VÀO ĐÂY
  API_LOGIN: "/api/web/session/authenticate",
  API_SIGNUP: "/api/signup",
  RPC_CALL: "/api/web/dataset/call_kw",

  API_TEST: "/api/v1/test",
  API_PARTNERS: "/api/v1/partners",
  API_TASKS: "/api/v1/tasks",
  API_TASK_DETAIL: (id) => `/api/v1/tasks/${id}`,
};

export default URL;
