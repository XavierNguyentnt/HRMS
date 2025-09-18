import React, { useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
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
import "./AuthPages.css"; // File CSS tùy chỉnh để giao diện đẹp hơn

function LoginPage() {
  const [identifier, setIdentifier] = useState("admin");
  const [password, setPassword] = useState("admin");

  // SỬA LỖI: Đổi tên biến để khớp với AuthContext
  const { handleLogin, isLoginLoading, loginError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    const sessionInfo = await handleLogin(identifier, password);
    if (sessionInfo) {
      navigate("/dashboard"); // Điều hướng đến trang chính sau khi thành công
    }
  };

  return (
    <div className="auth-wrapper">
      <Container className="d-flex align-items-center justify-content-center">
        <Row className="justify-content-center w-100">
          <Col md={6} lg={5} xl={4}>
            <Card className="shadow-lg border-0">
              <Card.Body className="p-4 p-sm-5">
                <h2 className="text-center mb-4 fw-bold">Đăng nhập</h2>
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3" controlId="identifier">
                    <Form.Label>Email hoặc Tên đăng nhập</Form.Label>
                    <Form.Control
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="Nhập email của bạn"
                      required
                      autoFocus
                      size="lg"
                    />
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="password">
                    <Form.Label>Mật khẩu</Form.Label>
                    <Form.Control
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Nhập mật khẩu"
                      required
                      size="lg"
                    />
                  </Form.Group>

                  {/* SỬA LỖI: Dùng đúng biến loginError */}
                  {loginError && <Alert variant="danger">{loginError}</Alert>}

                  <div className="d-grid mt-4">
                    <Button
                      variant="primary"
                      type="submit"
                      disabled={isLoginLoading} // SỬA LỖI: Dùng đúng biến isLoginLoading
                      size="lg">
                      {isLoginLoading ? ( // SỬA LỖI: Dùng đúng biến isLoginLoading
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
                        "Đăng nhập"
                      )}
                    </Button>
                  </div>
                </Form>
                {/* <div className="mt-4 text-center">
                  Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
                </div> */}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default LoginPage;
