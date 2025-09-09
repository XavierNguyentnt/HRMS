import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

// Component này hoạt động như một "người gác cổng"
function PrivateRoute({ children }) {
  const { user } = useAuth();

  // Nếu chưa có thông tin user (chưa đăng nhập), điều hướng về trang login
  if (!user) {
    // Thuộc tính 'replace' sẽ thay thế trang hiện tại trong lịch sử duyệt web,
    // để người dùng không thể nhấn nút "Back" quay lại trang được bảo vệ.
    return <Navigate to="/login" replace />;
  }

  // Nếu đã đăng nhập, cho phép hiển thị component con (trang được bảo vệ)
  return children;
}

export default PrivateRoute;
