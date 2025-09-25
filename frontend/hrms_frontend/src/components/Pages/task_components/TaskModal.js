import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Spinner, Alert } from "react-bootstrap";
import ReactQuill from "react-quill-new"; // Import ReactQuill
import "react-quill-new/dist/quill.snow.css"; // Import CSS cho editor

import {
  createTask,
  updateTask,
  fetchProjects, // Lấy danh sách dự án
  fetchUsers, // Lấy danh sách người dùng
} from "../../../services/api";
import { useAuth } from "../../../contexts/AuthContext";

const TaskModal = ({ show, onHide, project_id, task, onSave }) => {
  const { user } = useAuth();
  const isEditMode = task && task.id;

  // Sử dụng một state object để quản lý toàn bộ form
  const [formData, setFormData] = useState({});
  // State để lưu dữ liệu cho các dropdown
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  // State quản lý trạng thái
  const [loading, setLoading] = useState(false);
  const [loadingInitialData, setLoadingInitialData] = useState(true);
  const [error, setError] = useState(null);

  // useEffect để tải dữ liệu nền (dự án, người dùng) khi component được tạo
  useEffect(() => {
    const loadDropdownData = async () => {
      setLoadingInitialData(true);
      try {
        const [projectList, userList] = await Promise.all([
          fetchProjects(),
          fetchUsers(),
        ]);
        setProjects(projectList);
        setUsers(userList);
      } catch (err) {
        setError("Không thể tải dữ liệu cho form. Vui lòng thử lại.");
      } finally {
        setLoadingInitialData(false);
      }
    };
    loadDropdownData();
  }, []);

  // useEffect để điền dữ liệu vào form khi mở modal
  useEffect(() => {
    if (show) {
      if (isEditMode) {
        // Chế độ sửa: điền dữ liệu từ task có sẵn
        setFormData({
          name: task.name || "",
          project_id: task.project_id?.[0] || project_id,
          user_ids: task.user_ids || [],
          partner_id: task.partner_id?.[0] || "", // Người quản lý/đánh giá
          date_deadline: task.date_deadline
            ? task.date_deadline.replace(" ", "T") // Format cho datetime-local
            : "",
          description: task.description || "",
        });
      } else {
        // Chế độ tạo mới: reset form
        setFormData({
          name: "",
          project_id: project_id, // Lấy từ prop nếu có
          user_ids: [user.uid], // Mặc định gán cho người tạo
          partner_id: "",
          date_deadline: "",
          description: "",
        });
      }
    }
  }, [task, show, isEditMode, project_id, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMultiSelectChange = (e) => {
    const { name, options } = e.target;
    const selectedIds = Array.from(options)
      .filter((opt) => opt.selected)
      .map((opt) => parseInt(opt.value));
    setFormData((prev) => ({ ...prev, [name]: selectedIds }));
  };

  const handleDescriptionChange = (value) => {
    setFormData((prev) => ({ ...prev, description: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Chuẩn hóa dữ liệu trước khi gửi đi
    const dataToSend = {
      name: formData.name,
      project_id: parseInt(formData.project_id),
      partner_id: formData.partner_id ? parseInt(formData.partner_id) : false,
      date_deadline: formData.date_deadline
        ? formData.date_deadline.replace("T", " ")
        : false,
      description: formData.description,
      // Định dạng Many2many của Odoo
      user_ids: [[6, 0, formData.user_ids]],
    };

    try {
      if (isEditMode) {
        await updateTask(task.id, dataToSend);
      } else {
        await createTask(dataToSend);
      }
      onSave();
      onHide();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>
          {isEditMode ? "Chỉnh sửa Nhiệm vụ" : "Tạo Nhiệm vụ mới"}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loadingInitialData ? (
          <div className="text-center">
            <Spinner animation="border" />
          </div>
        ) : (
          <Form onSubmit={handleSubmit}>
            {error && <Alert variant="danger">{error}</Alert>}

            <Form.Group className="mb-3">
              <Form.Label>Tiêu đề *</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name || ""}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Dự án *</Form.Label>
                  <Form.Select
                    name="project_id"
                    value={formData.project_id || ""}
                    onChange={handleChange}
                    required
                    disabled={!!project_id}>
                    <option value="">-- Chọn dự án --</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Người được phân công</Form.Label>
                  <Form.Select
                    name="user_ids"
                    value={formData.user_ids || []}
                    onChange={handleMultiSelectChange}
                    multiple
                    style={{ height: "100px" }}>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Người quản lý (đánh giá)</Form.Label>
                  <Form.Select
                    name="partner_id"
                    value={formData.partner_id || ""}
                    onChange={handleChange}>
                    <option value="">-- Chọn người quản lý --</option>
                    {users.map((u) =>
                      u.partner_id ? (
                        <option key={u.id} value={u.partner_id[0]}>
                          {u.name}
                        </option>
                      ) : null
                    )}
                  </Form.Select>
                  <Form.Text muted>
                    Người này sẽ thay thế vai trò "Khách hàng" để đánh giá nhiệm
                    vụ.
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Hạn hoàn thành</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    name="date_deadline"
                    value={formData.date_deadline || ""}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Mô tả</Form.Label>
              <ReactQuill
                theme="snow"
                value={formData.description || ""}
                onChange={handleDescriptionChange}
              />
            </Form.Group>

            <div className="d-flex justify-content-end">
              <Button variant="secondary" onClick={onHide} disabled={loading}>
                Hủy
              </Button>
              <Button
                variant="primary"
                type="submit"
                className="ms-2"
                disabled={loading}>
                {loading ? (
                  <Spinner as="span" animation="border" size="sm" />
                ) : (
                  "Lưu"
                )}
              </Button>
            </div>
          </Form>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default TaskModal;
