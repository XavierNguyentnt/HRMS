import React from "react";
import "./App.css";

// Thêm 'Outlet' từ react-router-dom
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import PrivateRoute from "./components/Routes/PrivateRoute";
import AdminRoute from "./components/Routes/AdminRoute";

// Import các component Layout
import Header from "./components/Layout/Header";
import Sidebar from "./components/Layout/Sidebar";
import "./components/Layout/Layout.css";

// import RegisterPage from "./components/Pages/Auth/RegisterPage";
import LoginPage from "./components/Pages/Auth/LoginPage";
import ProfilePage from "./components/Pages/User/ProfilePage";
import DashboardPage from "./components/Pages/Dashboards/DashboardPage";
import DepartmentsPage from "./components/Pages/Department/DepartmentsPage";
import EmployeesPage from "./components/Pages/Employee/EmployeesPage";
import PendingUsersPage from "./components/Pages/Admin/PendingUsersPage";
// Project Pages
import ProjectDashboard from "./components/Pages/Projects/ProjectDashboard";
import ProjectDetailPage from "./components/Pages/Projects/ProjectDetailPage";
import TasksPage from "./components/Pages/Tasks/TasksPage";
import TaskDetailPage from "./components/Pages/Tasks/TaskDetailPage";

//DMS
import DocumentsPage from "./components/Pages/dms/DocumentsPage";
import DmsTrashPage from "./components/Pages/dms/DmsTrashPage";

// =================================================================
// Component Layout chính: Render Header và nội dung các trang con
// =================================================================
const MainLayout = () => {
  return (
    <div className="app-layout">
      <Header />
      <div className="main-content-wrapper">
        <Sidebar />
        <div className="content-area">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

function App() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontWeight: "600",
        }}>
        Đang tải phiên đăng nhập...
      </div>
    );
  }

  return (
    <div className="App">
      {/* Phần Routes giữ nguyên như cũ, không cần thay đổi */}
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" /> : <LoginPage />}
        />

        <Route
          path="/"
          element={user ? <MainLayout /> : <Navigate to="/login" />}>
          <Route index element={<Navigate to="dashboard" />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route
            path="departments"
            element={
              <PrivateRoute>
                <DepartmentsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="employees"
            element={
              <PrivateRoute>
                <EmployeesPage />
              </PrivateRoute>
            }
          />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="profile/:employeeId" element={<ProfilePage />} />

          {/* 1. Route cho trang DANH SÁCH DỰ ÁN */}
          <Route path="projects" element={<ProjectDashboard />} />
          {/* 2. Route cho trang CHI TIẾT DỰ ÁN (đây là route động) */}
          <Route path="projects/:projectId" element={<ProjectDetailPage />} />
          <Route
            path="/projects/:projectId/tasks/:taskId"
            element={<TaskDetailPage />}
          />
          <Route path="tasks" element={<TasksPage />} />
          {/*DMS*/}
          <Route
            path="documents"
            element={
              <PrivateRoute>
                <DocumentsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="documents/trash"
            element={
              <PrivateRoute>
                <DmsTrashPage />
              </PrivateRoute>
            }
          />
        </Route>

        {/* Admin routes */}
        <Route
          path="/admin/*"
          element={
            <AdminRoute>
              <MainLayout />
            </AdminRoute>
          }>
          <Route path="pending-users" element={<PendingUsersPage />} />
        </Route>

        <Route
          path="*"
          element={<Navigate to={user ? "/dashboard" : "/login"} />}>
          {" "}
        </Route>
      </Routes>
    </div>
  );
}

export default App;
