import React, { useState, useEffect } from "react";
import { fetchDocuments } from "../../../services/api/dmsAPI";
import DmsListView from "./DmsListView";
import DmsKanbanView from "./DmsKanbanView";
import DmsUploadModal from "./DmsUploadModal";
import DmsNewFileModal from "./DmsNewFileModal";
import { Button, ButtonGroup, Spinner } from "react-bootstrap";
import { Grid, List, Upload } from "lucide-react";

const DocumentsPage = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState("kanban"); // "kanban" | "list"
  const [showUpload, setShowUpload] = useState(false);
  const [showNewFile, setShowNewFile] = useState(false);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const data = await fetchDocuments([], 100);
      setDocuments(data);
    } catch (err) {
      console.error("Lỗi tải tài liệu:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  return (
    <div className="container-fluid py-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="fw-bold">📁 Quản lý tài liệu</h4>
        <div>
          <Button onClick={() => setShowNewFile(true)}>➕ Tạo mới File</Button>
          <Button variant="primary" onClick={() => setShowUpload(true)}>
            <Upload size={16} className="me-2" /> Upload
          </Button>
          <ButtonGroup className="ms-2">
            <Button
              variant={
                viewMode === "kanban" ? "secondary" : "outline-secondary"
              }
              onClick={() => setViewMode("kanban")}>
              <Grid size={16} />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "outline-secondary"}
              onClick={() => setViewMode("list")}>
              <List size={16} />
            </Button>
          </ButtonGroup>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      ) : viewMode === "kanban" ? (
        <DmsKanbanView documents={documents} />
      ) : (
        <DmsListView documents={documents} />
      )}

      <DmsNewFileModal
        show={showNewFile}
        onHide={() => setShowNewFile(false)}
        onSuccess={fetchDocuments}
      />
      <DmsUploadModal
        show={showUpload}
        onHide={() => setShowUpload(false)}
        onUploaded={loadDocuments}
      />
    </div>
  );
};

export default DocumentsPage;
