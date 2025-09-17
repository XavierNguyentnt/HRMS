// src/components/Pages/Auth/RegisterPage.js
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Form, Button, Card, Container, Spinner, Alert } from "react-bootstrap";
import * as odooApi from "../../../services/odooAPI";

function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await odooApi.registerEmployee(formData);
      setSuccess(result.message);
      setFormData({ name: "", email: "", password: "" }); // Xóa form sau khi thành công
    } catch (err) {
      setError(err.message || "Đăng ký không thành công. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container
      className="d-flex align-items-center justify-content-center"
      style={{ minHeight: "100vh" }}>
      <div className="w-100" style={{ maxWidth: "400px" }}>
        <Card>
          <Card.Body>
            <h2 className="text-center mb-4">Đăng ký tài khoản</h2>

            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}

            {!success && ( // Ẩn form đi sau khi đã đăng ký thành công
              <Form onSubmit={handleSubmit}>
                <Form.Group id="name" className="mb-3">
                  <Form.Label>Họ và tên</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                <Form.Group id="email" className="mb-3">
                  <Form.Label>Địa chỉ email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                <Form.Group id="password" className="mb-3">
                  <Form.Label>Mật khẩu</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                <Button
                  disabled={isLoading}
                  className="w-100 mt-3"
                  type="submit">
                  {isLoading ? <Spinner as="span" size="sm" /> : "Đăng ký"}
                </Button>
              </Form>
            )}
          </Card.Body>
        </Card>
        <div className="w-100 text-center mt-2">
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </div>
      </div>
    </Container>
  );
}

export default RegisterPage;
