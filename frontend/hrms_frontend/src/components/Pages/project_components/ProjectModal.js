import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Spinner } from "react-bootstrap";
import {
  fetchUsers,
  fetchAllTags, // Tối ưu: Dùng hàm fetchAllTags
  fetchProjectById, // Tối ưu: Dùng hàm này để lấy chi tiết
} from "../../../services/api";

// Sửa lại prop, thay vì projectId thì truyền thẳng project object
const ProjectModal = ({ show, onHide, onSave, project }) => {
  const [formData, setFormData] = useState({});
  const [users, setUsers] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  // useEffect để load dữ liệu nền (users, tags) và dữ liệu dự án (nếu sửa)
  useEffect(() => {
    if (!show) return;

    const loadInitialData = async () => {
      setLoadingData(true);
      try {
        // Load đồng thời users và tags để tăng tốc
        const [userList, tagList] = await Promise.all([
          fetchUsers(),
          fetchAllTags(),
        ]);
        setUsers(userList);
        setTags(tagList);

        if (project && project.id) {
          // CHẾ ĐỘ SỬA: Lấy dữ liệu chi tiết của chỉ một project
          const projectDetail = await fetchProjectById(project.id);
          setFormData({
            name: projectDetail.name || "",
            date_start: projectDetail.date_start || "",
            date: projectDetail.date || "",
            user_id: projectDetail.user_id?.[0] || "",
            partner_id: projectDetail.partner_id?.[0] || "",
            tag_ids: projectDetail.tag_ids || [],
          });
        } else {
          // CHẾ ĐỘ TẠO MỚI: Reset form
          setFormData({
            name: "",
            date_start: "",
            date: "",
            user_id: "",
            partner_id: "",
            tag_ids: [],
          });
        }
      } catch (err) {
        console.error("Lỗi load dữ liệu ProjectModal:", err);
        alert("Không thể tải dữ liệu cho modal.");
      } finally {
        setLoadingData(false);
      }
    };

    loadInitialData();
  }, [show, project]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTagsChange = (e) => {
    const selected = Array.from(e.target.selectedOptions, (opt) =>
      parseInt(opt.value)
    );
    setFormData((prev) => ({
      ...prev,
      tag_ids: [[6, 0, selected]], // Định dạng Many2many của Odoo
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      alert("Tên dự án là bắt buộc");
      return;
    }
    setLoading(true);
    try {
      const dataToSave = { ...formData };
      // Chuyển đổi ID thành integer nếu có giá trị
      if (dataToSave.user_id) dataToSave.user_id = parseInt(dataToSave.user_id);
      if (dataToSave.partner_id)
        dataToSave.partner_id = parseInt(dataToSave.partner_id);

      // Nếu không có ngày thì gửi false cho Odoo
      if (!dataToSave.date_start) dataToSave.date_start = false;
      if (!dataToSave.date) dataToSave.date = false;

      await onSave(dataToSave);
    } catch (err) {
      console.error("Lỗi khi lưu:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} backdrop="static" size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          {project ? "Chỉnh sửa dự án" : "Tạo mới dự án"}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loadingData ? (
          <div className="text-center py-5">
            <Spinner animation="border" />
          </div>
        ) : (
          <Form>
            <Row className="mb-3">
              <Col md={12}>
                <Form.Group controlId="name">
                  <Form.Label>Tên dự án *</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Nhập tên dự án"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group controlId="date_start">
                  <Form.Label>Ngày bắt đầu</Form.Label>
                  <Form.Control
                    type="date"
                    name="date_start"
                    value={formData.date_start}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="date">
                  <Form.Label>Ngày kết thúc</Form.Label>
                  <Form.Control
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group controlId="user_id">
                  <Form.Label>Trưởng dự án</Form.Label>
                  <Form.Select
                    name="user_id"
                    value={formData.user_id}
                    onChange={handleChange}>
                    <option value="">-- Chọn --</option>
                    {users.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="partner_id">
                  <Form.Label>Khách hàng</Form.Label>
                  <Form.Control
                    type="text"
                    name="partner_id"
                    value={formData.partner_id}
                    onChange={handleChange}
                    placeholder="Nhập ID khách hàng hoặc để trống"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group controlId="company_id">
                  <Form.Label>Công ty</Form.Label>
                  <Form.Control
                    type="text"
                    name="company_id"
                    value={formData.company_id}
                    onChange={handleChange}
                    placeholder="Nhập ID công ty"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="tag_ids">
                  <Form.Label>Thẻ</Form.Label>
                  <Form.Select
                    multiple
                    name="tag_ids"
                    value={formData.tag_ids}
                    onChange={handleTagsChange}>
                    {tags.map((tag) => (
                      <option key={tag.id} value={tag.id}>
                        {tag.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Hủy
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={loading || loadingData}>
          {loading ? <Spinner size="sm" animation="border" /> : "Lưu"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ProjectModal;
