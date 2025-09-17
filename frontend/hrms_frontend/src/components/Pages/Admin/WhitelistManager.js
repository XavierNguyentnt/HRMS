import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Form,
  Spinner,
  Alert,
  Container,
} from "react-bootstrap";
import * as odooApi from "../../../services/odooAPI";

function WhitelistManager() {
  const [whitelist, setWhitelist] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newItem, setNewItem] = useState({ name: "", email: "" });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await odooApi.fetchWhitelist();
      setWhitelist(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc muốn xóa email này?")) {
      await odooApi.deleteWhitelistEmail(id);
      loadData(); // Tải lại danh sách
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    await odooApi.addWhitelistEmail(newItem);
    setNewItem({ name: "", email: "" }); // Reset form
    loadData(); // Tải lại danh sách
  };

  const handleChange = (e) => {
    setNewItem({ ...newItem, [e.target.name]: e.target.value });
  };

  if (isLoading) return <Spinner />;

  return (
    <Container>
      <h2 className="my-4">Quản lý Email được phép đăng ký</h2>
      {error && <Alert variant="danger">{error}</Alert>}

      <Form onSubmit={handleAdd} className="mb-4 d-flex gap-2">
        <Form.Control
          type="text"
          name="name"
          placeholder="Tên nhân viên"
          value={newItem.name}
          onChange={handleChange}
          required
        />
        <Form.Control
          type="email"
          name="email"
          placeholder="Email"
          value={newItem.email}
          onChange={handleChange}
          required
        />
        <Button type="submit">Thêm</Button>
      </Form>

      <Table striped bordered hover>
        <thead>
          <tr>
            <th>ID</th>
            <th>Tên</th>
            <th>Email</th>
            <th>Trạng thái</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {whitelist.map((item) => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>{item.name}</td>
              <td>{item.email}</td>
              <td>{item.state}</td>
              <td>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(item.id)}>
                  Xóa
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
}

export default WhitelistManager;