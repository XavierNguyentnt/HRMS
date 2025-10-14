// src/components/Pages/DMS/DmsNewFolderModal.js
import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";

const DmsNewFolderModal = ({ show, onHide, onSubmit }) => {
  const [name, setName] = useState("");

  const handleSubmit = () => {
    if (name.trim()) {
      onSubmit(name.trim());
      setName(""); // Reset
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Tạo thư mục mới</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Control
          type="text"
          placeholder="Nhập tên thư mục"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          autoFocus
        />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Hủy
        </Button>
        <Button variant="primary" onClick={handleSubmit}>
          Tạo
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DmsNewFolderModal;
