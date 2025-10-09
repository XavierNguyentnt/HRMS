import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Spinner } from "react-bootstrap";
import { createDocument } from "../../../services/api/dmsAPI";
import axiosInstance from "../../../util/axios_instance";
import URL from "../../../util/url";

const DmsNewFileModal = ({ show, onHide, onSuccess }) => {
  const [directories, setDirectories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [form, setForm] = useState({
    name: "",
    directory_id: "",
    category_id: "",
    tag_ids: [],
    file: null,
  });
  const [loading, setLoading] = useState(false);

  // --- Load dữ liệu dropdown ---
  useEffect(() => {
    if (show) {
      loadDirectories();
      loadCategories();
      loadTags();
    }
  }, [show]);

  const loadDirectories = async () => {
    const params = {
      model: "dms.directory",
      method: "search_read",
      args: [[]],
      kwargs: { fields: ["id", "name"], limit: 100 },
    };
    const res = await axiosInstance.post(URL.RPC_CALL, {
      jsonrpc: "2.0",
      params,
    });
    setDirectories(res.data.result || []);
  };

  const loadCategories = async () => {
    const params = {
      model: "dms.category",
      method: "search_read",
      args: [[]],
      kwargs: { fields: ["id", "name"], limit: 100 },
    };
    const res = await axiosInstance.post(URL.RPC_CALL, {
      jsonrpc: "2.0",
      params,
    });
    setCategories(res.data.result || []);
  };

  const loadTags = async () => {
    const params = {
      model: "dms.tag",
      method: "search_read",
      args: [[]],
      kwargs: { fields: ["id", "name"], limit: 100 },
    };
    const res = await axiosInstance.post(URL.RPC_CALL, {
      jsonrpc: "2.0",
      params,
    });
    setTags(res.data.result || []);
  };

  // --- Xử lý upload ---
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileName = file.name.replace(/\.[^/.]+$/, ""); // bỏ phần .ext
    setForm((prev) => ({
      ...prev,
      file,
      name: prev.name || fileName, // chỉ auto-fill nếu chưa nhập
    }));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.directory_id || !form.file) {
      alert("Vui lòng nhập tên, chọn thư mục và chọn file.");
      return;
    }

    setLoading(true);
    try {
      // convert file to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result.split(",")[1];
        const payload = {
          name: form.name,
          directory_id: parseInt(form.directory_id),
          category_id: form.category_id ? parseInt(form.category_id) : false,
          tag_ids: form.tag_ids.map((id) => parseInt(id)),
          mimetype: form.file.type,
          extension: form.file.name.split(".").pop(),
          base64Data,
        };
        await createDocument(payload);
        onSuccess?.();
        onHide();
      };
      reader.readAsDataURL(form.file);
    } catch (error) {
      alert("Lỗi khi tạo file mới: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>Tạo mới File</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Tên file</Form.Label>
                <Form.Control
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Chọn thư mục</Form.Label>
                <Form.Select
                  value={form.directory_id}
                  onChange={(e) =>
                    setForm({ ...form, directory_id: e.target.value })
                  }>
                  <option value="">-- Chọn --</option>
                  {directories.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Danh mục</Form.Label>
                <Form.Select
                  value={form.category_id}
                  onChange={(e) =>
                    setForm({ ...form, category_id: e.target.value })
                  }>
                  <option value="">-- Không chọn --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Tags</Form.Label>
                <Form.Select
                  multiple
                  value={form.tag_ids}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      tag_ids: Array.from(
                        e.target.selectedOptions,
                        (o) => o.value
                      ),
                    })
                  }>
                  {tags.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          <Form.Group>
            <Form.Label>Nội dung File</Form.Label>
            <Form.Control type="file" onChange={handleFileChange} />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Hủy
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={loading}>
          {loading ? <Spinner size="sm" /> : "Tạo mới"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DmsNewFileModal;
