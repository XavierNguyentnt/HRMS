import React from "react";
// Thêm 'Outlet' từ react-router-dom
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import PrivateRoute from "./components/Routes/PrivateRoute";
import AdminRoute from "./components/Routes/AdminRoute";

// Import các component
import Header from "./components/Pages/Commons/Header";
import LoginPage from "./components/Pages/Auth/LoginPage";
import RegisterPage from "./components/Pages/Auth/RegisterPage";
import ProfilePage from "./components/Pages/User/ProfilePage";
import DashboardPage from "./components/Pages/Dashboards/DashboardPage";
import DepartmentsPage from "./components/Pages/Department/DepartmentsPage";
import EmployeesPage from "./components/Pages/Employee/EmployeesPage";
import PendingUsersPage from "./components/Pages/Admin/PendingUsersPage";

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
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" /> : <LoginPage />}
        />
        <Route
          path="/register"
          element={user ? <Navigate to="/dashboard" /> : <RegisterPage />}
        />

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
