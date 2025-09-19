// src/components/Pages/project_components/TaskModal.js
import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { createTask, updateTask } from "../../../services/odooAPI";

const TaskModal = ({ show, onHide, projectId, task, onSave }) => {
  const [name, setName] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priorityLevel, setPriorityLevel] = useState("medium");
  const [description, setDescription] = useState("");
  const [error, setError] = useState(null);

  const isEditMode = task && task.id;

  useEffect(() => {
    if (isEditMode) {
      setName(task.name || "");
      setDeadline(task.date_deadline || "");
      setPriorityLevel(task.priority_level || "medium");
      setDescription(task.description || "");
    } else {
      // Reset form khi mở modal để tạo mới
      setName("");
      setDeadline("");
      setPriorityLevel("medium");
      setDescription("");
    }
  }, [task, show, isEditMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const taskData = {
      name,
      project_id: projectId,
      date_deadline: deadline || false,
      priority_level: priorityLevel,
      description: description,
    };

    try {
      if (isEditMode) {
        await updateTask(task.id, taskData);
      } else {
        await createTask(taskData);
      }
      onSave(); // Gọi hàm onSave để reload lại danh sách tasks
      onHide(); // Đóng modal
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>
          {isEditMode ? "Chỉnh sửa Task" : "Tạo Task mới"}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <p className="text-danger">{error}</p>}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Tên Task</Form.Label>
            <Form.Control
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Deadline</Form.Label>
            <Form.Control
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Mức độ ưu tiên</Form.Label>
            <Form.Select
              value={priorityLevel}
              onChange={(e) => setPriorityLevel(e.target.value)}>
              <option value="low">Thấp</option>
              <option value="medium">Trung bình</option>
              <option value="high">Cao</option>
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Mô tả</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Form.Group>
          <Button variant="secondary" onClick={onHide}>
            Hủy
          </Button>
          <Button variant="primary" type="submit" className="ms-2">
            Lưu
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default TaskModal;
