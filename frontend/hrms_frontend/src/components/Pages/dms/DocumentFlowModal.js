import React from "react";
import { Modal, Button, Table, Spinner } from "react-bootstrap";

const DocumentFlowModal = ({
  show,
  onHide,
  routes,
  onAdvance,
  onCreateRoute,
  loading,
}) => {
  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>🔁 Luồng xử lý văn bản</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading ? (
          <div className="text-center py-3">
            <Spinner animation="border" />
          </div>
        ) : (
          <Table bordered hover>
            <thead>
              <tr>
                <th>#</th>
                <th>Từ phòng</th>
                <th>Đến phòng</th>
                <th>Người xử lý</th>
                <th>Loại</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {routes.length > 0 ? (
                routes.map((r, i) => (
                  <tr key={r.id || i}>
                    <td>{r.sequence}</td>
                    <td>{r.from_department_id?.[1] || "-"}</td>
                    <td>{r.to_department_id?.[1] || "-"}</td>
                    <td>{r.user_id?.[1] || "-"}</td>
                    <td>{r.action_type}</td>
                    <td>{r.state}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center text-muted">
                    Chưa có luồng xử lý nào.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={onAdvance}>
          ➡️ Chuyển bước
        </Button>
        <Button variant="success" onClick={onCreateRoute}>
          ➕ Thêm bước
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DocumentFlowModal;
