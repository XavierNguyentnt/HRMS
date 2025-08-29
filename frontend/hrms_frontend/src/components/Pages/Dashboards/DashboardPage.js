import React from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
// Thêm Spinner để làm hiệu ứng tải
import { Container, Card, Button, Spinner } from "react-bootstrap";

function DashboardPage() {
  const { user, handleLogout } = useAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    handleLogout();
    navigate("/login");
  };

  // ==========================================================
  // THÊM ĐOẠN KIỂM TRA NÀY
  // Nếu user chưa được tải (từ localStorage hoặc sau khi login/register),
  // hiển thị một màn hình chờ.
  if (!user) {
    return (
      <Container
        className="d-flex justify-content-center align-items-center"
        style={{ height: "100vh" }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }
  // ==========================================================

  // Khi user đã chắc chắn tồn tại, mới render nội dung bên dưới
  return (
    <Container className="py-5">
      <Card className="shadow-sm">
        <Card.Body className="p-4">
          <Card.Title as="h1" className="mb-3">
            Chào mừng trở lại, {user.name}!
          </Card.Title>
          <Card.Text>Đây là trang Dashboard của bạn.</Card.Text>
          <hr />
          <div>
            <p>
              <strong>User ID:</strong> {user.uid}
            </p>
            <p>
              <strong>Database:</strong> {user.db}
            </p>
            {/* Sửa lại cách lấy email cho chính xác hơn */}
            <p>
              <strong>Email:</strong>{" "}
              {user.user_context?.email || user.username}
            </p>
          </div>
          <Button variant="danger" onClick={onLogout} className="mt-3">
            Đăng xuất
          </Button>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default DashboardPage;
