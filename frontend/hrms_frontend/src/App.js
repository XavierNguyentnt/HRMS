import React from "react";
// Thêm 'Outlet' từ react-router-dom
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import PrivateRoute from "./components/Routes/PrivateRoute";

// Import các component
import Header from "./components/Pages/Commons/Header";
import LoginPage from "./components/Pages/Auth/LoginPage";
// import RegisterPage from "./components/Pages/Auth/RegisterPage";
import ProfilePage from "./components/Pages/User/ProfilePage";
import DashboardPage from "./components/Pages/Dashboards/DashboardPage";
import DepartmentsPage from "./components/Pages/Department/DepartmentsPage";
import EmployeesPage from "./components/Pages/Employee/EmployeesPage";

// =================================================================
// Component Layout chính: Render Header và nội dung các trang con
// =================================================================
const MainLayout = () => {
  return (
    <>
      <Header />
      <main className="container py-4">
        {/* <Outlet /> là nơi các component con (Dashboard, Profile) sẽ được render */}
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
        {/* ================================================================= */}
        {/* CÁC ROUTE CÔNG KHAI (KHÔNG CÓ HEADER) */}
        {/* ================================================================= */}
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" /> : <LoginPage />}
        />
        {/* <Route
          path="/register"
          element={user ? <Navigate to="/dashboard" /> : <RegisterPage />}
        /> */}

        {/* ================================================================= */}
        {/* CÁC ROUTE ĐƯỢC BẢO VỆ (SỬ DỤNG MAINLAYOUT VÀ CÓ HEADER) */}
        {/* ================================================================= */}
        <Route
          path="/"
          element={user ? <MainLayout /> : <Navigate to="/login" />}>
          {/* Các route con này sẽ được render bên trong <Outlet /> của MainLayout */}
          <Route path="dashboard" element={<DashboardPage />} />
          <Route
            path="/departments"
            element={
              <PrivateRoute>
                <DepartmentsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/employees"
            element={
              <PrivateRoute>
                <EmployeesPage />
              </PrivateRoute>
            }
          />
          <Route path="/profile/:employeeId" element={<ProfilePage />} />
          <Route path="profile" element={<ProfilePage />} />

          {/* Khi cần thêm trang mới có Header, chỉ cần thêm vào đây:
            <Route path="projects" element={<ProjectsPage />} /> 
          */}

          {/* Route mặc định khi đã đăng nhập */}
          <Route index element={<Navigate to="/dashboard" />} />
        </Route>

        {/* Route bắt lỗi 404 hoặc điều hướng người lạ */}
        <Route
          path="*"
          element={<Navigate to={user ? "/dashboard" : "/login"} />}
        />
      </Routes>
    </div>
  );
}

export default App;
