const URL = {
  API_LOGIN: "/session/authenticate",
  API_SIGNUP: "/session/signup",
  RPC_CALL: "/dataset/call_kw", // nếu cần

  API_TEST: "/api/v1/test",
  API_PARTNERS: "/api/v1/partners",
  API_TASKS: "/api/v1/tasks",
  API_TASK_DETAIL: (id) => `/api/v1/tasks/${id}`,
};

export default URL;
