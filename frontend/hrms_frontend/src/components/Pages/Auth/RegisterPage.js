// src/components/Pages/Auth/RegisterPage.js

import React, { useState } from "react";
import { Link } from "react-router-dom";
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

  const [successMessage, setSuccessMessage] = useState("");
  const [localError, setLocalError] = useState("");
  const { handleRegister, isRegisterLoading, registerError } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLocalError("");
    setSuccessMessage("");

    if (password !== confirmPassword) {
      setLocalError("Mật khẩu xác nhận không khớp!");
      return;
    }

    const success = await handleRegister({ name, email, password });

    if (success) {
      setSuccessMessage(
        "Tài khoản đăng ký thành công, vui lòng chờ Quản trị viên phê duyệt."
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
                <h2 className="text-center mb-4">Đăng Ký Tài Khoản</h2>

                {successMessage ? (
                  <Alert variant="success">
                    <Alert.Heading>Thành công!</Alert.Heading>
                    <p>{successMessage}</p>
                    <hr />
                    <div className="d-flex justify-content-end">
                      <Link to="/login" className="btn btn-outline-success">
                        Về trang Đăng nhập
                      </Link>
                    </div>
                  </Alert>
                ) : (
                  <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                      <Form.Label>Họ và Tên</Form.Label>
                      <Form.Control
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        size="lg"
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Email</Form.Label>
                      <Form.Control
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        size="lg"
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Mật khẩu</Form.Label>
                      <Form.Control
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        size="lg"
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Xác nhận Mật khẩu</Form.Label>
                      <Form.Control
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        size="lg"
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
                            <Spinner as="span" animation="border" size="sm" />
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
