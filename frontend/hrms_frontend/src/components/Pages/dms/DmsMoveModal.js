// src/components/Pages/DMS/DmsMoveModal.js

import React, { useState, useEffect } from "react";
import { Modal, Button, ListGroup, Spinner, Breadcrumb } from "react-bootstrap";
import { Folder, ArrowLeft } from "lucide-react";
import { fetchSubFolders } from "../../../services/api/dmsAPI";

const DmsMoveModal = ({ show, onHide, itemsToMove = [], onConfirmMove }) => {
  const [currentPath, setCurrentPath] = useState([
    { id: false, name: "Tất cả vị trí" },
  ]);
  const [subFolders, setSubFolders] = useState([]);
  const [loading, setLoading] = useState(false);

  const currentDir = currentPath[currentPath.length - 1];
  const currentDirId = currentDir.id;
  const itemsText =
    itemsToMove.length > 1
      ? `${itemsToMove.length} mục`
      : `"${itemsToMove[0]?.name}"`;

  useEffect(() => {
    if (show) {
      setLoading(true);
      // Sử dụng currentDirId ổn định để fetch
      fetchSubFolders(currentDirId)
        .then(setSubFolders)
        .finally(() => setLoading(false));
    } else {
      // Reset về gốc khi modal bị đóng
      setCurrentPath([{ id: false, name: "Tất cả vị trí" }]);
      setSubFolders([]);
    }
  }, [show, currentDirId]); // 👈 Chỉ phụ thuộc vào các giá trị ổn định

  const handleNavigate = (folder) => {
    setCurrentPath((prev) => [...prev, folder]);
  };

  const handleBreadcrumbClick = (index) => {
    setCurrentPath((prev) => prev.slice(0, index + 1));
  };

  const handleBack = () => {
    if (currentPath.length > 1) {
      setCurrentPath((prev) => prev.slice(0, -1));
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Di chuyển {itemsText}</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ minHeight: "300px" }}>
        <div className="d-flex align-items-center mb-2">
          {currentPath.length > 1 && (
            <Button
              variant="light"
              size="sm"
              className="me-2"
              onClick={handleBack}>
              <ArrowLeft size={16} />
            </Button>
          )}
          <Breadcrumb listProps={{ className: "mb-0" }}>
            {currentPath.map((p, index) => (
              <Breadcrumb.Item
                key={p.id || "root"}
                active={index === currentPath.length - 1}
                onClick={() => handleBreadcrumbClick(index)}>
                {p.name}
              </Breadcrumb.Item>
            ))}
          </Breadcrumb>
        </div>
        <hr className="mt-1" />
        {loading ? (
          <div className="text-center">
            <Spinner animation="border" />
          </div>
        ) : (
          <ListGroup variant="flush">
            {subFolders.map((folder) => (
              <ListGroup.Item
                action
                key={folder.id}
                onClick={() => handleNavigate(folder)}
                className="d-flex align-items-center">
                <Folder size={20} className="me-2 text-muted" />
                {folder.name}
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Hủy
        </Button>
        <Button variant="primary" onClick={() => onConfirmMove(currentDir.id)}>
          Di chuyển đến đây
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DmsMoveModal;
