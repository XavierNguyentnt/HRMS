import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Spinner,
  Alert,
} from "react-bootstrap";
import { useAuth } from "../../../contexts/AuthContext"; // Giả sử bạn sẽ thêm handleRegister vào đây
import "./AuthPages.css";

function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(""); // Lỗi local cho validation

  // Giả sử bạn sẽ có các state này từ AuthContext
  const { handleRegister, isRegisterLoading, registerError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp!");
      return;
    }
    setError(""); // Xóa lỗi cũ

    // Gọi hàm đăng ký từ context
    const success = await handleRegister({ name, email, password });
    if (success) {
      navigate("/dashboard"); // Hoặc trang chào mừng
    }
  };

  return (
    <div className="auth-wrapper">
      <Container className="d-flex align-items-center justify-content-center">
        <Row className="justify-content-center w-100">
          <Col md={6} lg={5} xl={4}>
            <Card className="shadow-lg border-0">
              <Card.Body className="p-4 p-sm-5">
                <h2 className="text-center mb-4 fw-bold">Tạo tài khoản</h2>
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3" controlId="name">
                    <Form.Label>Họ và Tên</Form.Label>
                    <Form.Control
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      size="lg"
                    />
                  </Form.Group>
                  <Form.Group className="mb-3" controlId="email">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      size="lg"
                    />
                  </Form.Group>
                  <Form.Group className="mb-3" controlId="password">
                    <Form.Label>Mật khẩu</Form.Label>
                    <Form.Control
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      size="lg"
                    />
                  </Form.Group>
                  <Form.Group className="mb-3" controlId="confirmPassword">
                    <Form.Label>Xác nhận Mật khẩu</Form.Label>
                    <Form.Control
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      size="lg"
                    />
                  </Form.Group>

                  {(error || registerError) && (
                    <Alert variant="danger">{error || registerError}</Alert>
                  )}

                  <div className="d-grid mt-4">
                    <Button
                      variant="primary"
                      type="submit"
                      disabled={isRegisterLoading}
                      size="lg">
                      {isRegisterLoading ? (
                        <Spinner animation="border" size="sm" />
                      ) : (
                        "Đăng ký"
                      )}
                    </Button>
                  </div>
                </Form>
                <div className="mt-4 text-center">
                  Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default RegisterPage;
