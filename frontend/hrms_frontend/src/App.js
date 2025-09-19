import React from "react";
// Thêm 'Outlet' từ react-router-dom
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import PrivateRoute from "./components/Routes/PrivateRoute";
import AdminRoute from "./components/Routes/AdminRoute";

// Import các component
import Header from "./components/Pages/Commons/Header";
import LoginPage from "./components/Pages/Auth/LoginPage";
// import RegisterPage from "./components/Pages/Auth/RegisterPage";
import ProfilePage from "./components/Pages/User/ProfilePage";
import DashboardPage from "./components/Pages/Dashboards/DashboardPage";
import DepartmentsPage from "./components/Pages/Department/DepartmentsPage";
import EmployeesPage from "./components/Pages/Employee/EmployeesPage";
import PendingUsersPage from "./components/Pages/Admin/PendingUsersPage";
// Project Pages
import ProjectDashboard from "./components/Pages/Projects/ProjectDashboard";
import ProjectDetailPage from "./components/Pages/Projects/ProjectDetailPage";

// =================================================================
// Component Layout chính: Render Header và nội dung các trang con
// =================================================================
const MainLayout = () => {
  return (
    <>
      <Header />
      {/* Container được chuyển vào từng trang con để linh hoạt hơn */}
      <main>
        <Outlet />
      </main>
    </>
  );
};

function App() {
  const { user } = useAuth();

  return (
    <div className="App">
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" /> : <LoginPage />}
        />
        {/* <Route
          path="/register"
          element={user ? <Navigate to="/dashboard" /> : <RegisterPage />}
        /> */}

        {/* Main layout cho các route bình thường */}
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
          {/* Khi người dùng vào '/projects', component ProjectDashboard sẽ được render */}
          <Route path="projects" element={<ProjectDashboard />} />

          {/* 2. Route cho trang CHI TIẾT DỰ ÁN (đây là route động) */}
          {/* Khi người dùng vào '/projects/1', '/projects/2'... component ProjectDetailPage sẽ được render */}
          {/* `projectId` sẽ được dùng làm tham số trong component con */}
          <Route path="projects/:projectId" element={<ProjectDetailPage />} />
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
          element={<Navigate to={user ? "/dashboard" : "/login"} />}
        />
      </Routes>
    </div>
  );
}

export default App;
