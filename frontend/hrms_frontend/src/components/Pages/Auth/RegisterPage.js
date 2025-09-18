// src/components/Pages/Auth/RegisterPage.jsx

import React, { useState } from "react";
import { Link } from "react-router-dom"; // Bỏ useNavigate vì không cần nữa
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
import { useAuth } from "../../../contexts/AuthContext";
import "./AuthPages.css";

function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Thêm state mới để lưu thông báo thành công
  const [successMessage, setSuccessMessage] = useState("");

  const [localError, setLocalError] = useState("");
  const { handleRegister, isRegisterLoading, registerError } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Xóa các thông báo cũ
    setLocalError("");
    setSuccessMessage("");

    if (password !== confirmPassword) {
      setLocalError("Mật khẩu xác nhận không khớp!");
      return;
    }

    const success = await handleRegister({ name, email, password });

    if (success) {
      // Thay vì điều hướng, chúng ta sẽ set thông báo thành công
      setSuccessMessage(
        "Đăng ký thành công! Vui lòng quay lại trang đăng nhập để tiếp tục."
      );
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

                {/* Dựa vào `successMessage` để hiển thị form hoặc thông báo */}
                {successMessage ? (
                  // Giao diện khi đăng ký thành công
                  <div className="text-center">
                    <Alert variant="success">{successMessage}</Alert>
                    <Link to="/login">
                      <Button variant="primary" size="lg">
                        Đi đến trang Đăng nhập
                      </Button>
                    </Link>
                  </div>
                ) : (
                  // Giao diện form đăng ký
                  <Form onSubmit={handleSubmit} noValidate>
                    <Form.Group className="mb-3" controlId="name">
                      <Form.Label>Họ và Tên</Form.Label>
                      <Form.Control
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        size="lg"
                        placeholder="Nhập họ và tên"
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
                        placeholder="Nhập email"
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
                        placeholder="Nhập mật khẩu"
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
                        placeholder="Nhập lại mật khẩu"
                      />
                    </Form.Group>

                    {(localError || registerError) && (
                      <Alert variant="danger">
                        {localError || registerError}
                      </Alert>
                    )}

                    <div className="d-grid mt-4">
                      <Button
                        variant="primary"
                        type="submit"
                        disabled={isRegisterLoading}
                        size="lg">
                        {isRegisterLoading ? (
                          <>
                            <Spinner
                              as="span"
                              animation="border"
                              size="sm"
                              role="status"
                              aria-hidden="true"
                            />
                            <span className="ms-2">Đang xử lý...</span>
                          </>
                        ) : (
                          "Đăng ký"
                        )}
                      </Button>
                    </div>
                    <div className="mt-4 text-center">
                      Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
                    </div>
                  </Form>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default RegisterPage;
