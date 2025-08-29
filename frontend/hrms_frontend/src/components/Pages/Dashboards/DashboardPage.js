import React from "react";
import { useAuth } from "../../../contexts/AuthContext";

function DashboardPage() {
  const { user, handleLogout } = useAuth(); // Lấy user và hàm logout từ context

  const onLogout = () => {
    handleLogout();
    // Không cần navigate ở đây, App.js sẽ tự động xử lý
  };

  // Nếu chưa có thông tin user, App.js sẽ tự động chuyển hướng
  // Dòng này chỉ để phòng trường hợp component render trước khi chuyển hướng
  if (!user) {
    return null;
  }

  return (
    <div>
      <h1>Chào mừng trở lại, {user.name}!</h1>
      <p>Đây là trang Dashboard của bạn.</p>
      <p>User ID: {user.uid}</p>
      <p>Database: {user.db}</p>
      <button onClick={onLogout}>Đăng xuất</button>
    </div>
  );
}

export default DashboardPage;
