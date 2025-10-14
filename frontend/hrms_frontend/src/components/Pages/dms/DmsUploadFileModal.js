import React, { useState } from "react";
import { Modal, Button, Form, Spinner } from "react-bootstrap";
import { createDocument } from "../../../services/api/dmsAPI";

const DmsUploadModal = ({ show, onHide, onUploaded }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target.result.split(",")[1];
        await createDocument({
          name: file.name,
          mimetype: file.type,
          base64Data,
          directory_id: null, // Hoặc truyền ID thư mục hiện tại
        });
        onUploaded();
        onHide();
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>📤 Tải lên tài liệu</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group>
          <Form.Label>Chọn tệp</Form.Label>
          <Form.Control
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
          />
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Hủy
        </Button>
        <Button variant="primary" onClick={handleUpload} disabled={uploading}>
          {uploading ? <Spinner size="sm" /> : "Tải lên"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DmsUploadModal;
