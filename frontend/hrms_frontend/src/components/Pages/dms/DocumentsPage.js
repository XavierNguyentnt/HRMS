// src/components/Pages/DMS/DocumentsPage.js
import React, { useState, useEffect, useCallback } from "react";
import { fetchDocuments } from "../../../services/api/dmsAPI";
import DmsToolbar from "./DmsToolbar";
import DmsListView from "./DmsListView";
import DmsKanbanView from "./DmsKanbanView";
import DmsUploadModal from "./DmsUploadModal";
import DmsNewFileModal from "./DmsNewFileModal";
import DmsDirectoryPanel from "./DmsDirectoryPanel";
import DmsBreadcrumbs from "./DmsBreadcrumbs";
import { Button, Spinner } from "react-bootstrap";
import { useDocuments } from "../../hooks/useDocuments";
import { Upload, Plus, PanelRightClose, PanelRightOpen } from "lucide-react";

const DocumentsPage = () => {
  const { documents, loading, setFilters, refresh, filters } = useDocuments();
  const [viewMode, setViewMode] = useState("kanban");
  const [showUpload, setShowUpload] = useState(false);
  const [showNewFile, setShowNewFile] = useState(false);
  const [showDirectoryPanel, setShowDirectoryPanel] = useState(true);
  const [breadcrumbPath, setBreadcrumbPath] = useState([]);

  // Lấy selectedDir để truyền cho Modal
  const [selectedDir, setSelectedDirState] = useState(null);
  const handleSelectDirectory = (dir, path) => {
    setSelectedDirState(dir);
    setFilters.setSelectedDir(dir);
    setBreadcrumbPath(path); // 👈 Cập nhật state đường dẫn
  };

  return (
    <div className="documents-page d-flex">
      <div className="flex-grow-1 p-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="fw-bold mb-0">📁 Quản lý tài liệu</h4>
          <div className="d-flex gap-2">
            <Button variant="success" onClick={() => setShowNewFile(true)}>
              <Plus size={16} className="me-1" /> Tạo mới
            </Button>
            <Button variant="primary" onClick={() => setShowUpload(true)}>
              <Upload size={16} className="me-1" /> Upload
            </Button>
            <Button
              variant="outline-secondary"
              onClick={() => setShowDirectoryPanel(!showDirectoryPanel)}>
              {showDirectoryPanel ? (
                <PanelRightClose size={18} />
              ) : (
                <PanelRightOpen size={18} />
              )}
            </Button>
          </div>
        </div>

        <DmsBreadcrumbs
          path={breadcrumbPath} // 👈 Truyền đường dẫn xuống
          onNavigate={handleSelectDirectory}
        />

        <DmsToolbar
          onSearch={setFilters.setSearchTerm}
          onSortChange={setFilters.setSortConfig}
          onViewChange={setViewMode}
          onDateFilter={setFilters.setDateRange}
          currentView={viewMode}
        />

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" />
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center text-muted py-5">
            Không có tài liệu nào.
          </div>
        ) : viewMode === "list" ? (
          <DmsListView documents={documents} />
        ) : (
          <DmsKanbanView documents={documents} />
        )}

        <DmsNewFileModal
          show={showNewFile}
          onHide={() => setShowNewFile(false)}
          onSuccess={refresh} // Gọi hàm refresh từ hook
          selectedDirId={selectedDir?.id}
        />
        <DmsUploadModal
          show={showUpload}
          onHide={() => setShowUpload(false)}
          onUploaded={refresh} // Gọi hàm refresh từ hook
          selectedDirId={selectedDir?.id}
        />
      </div>

      {showDirectoryPanel && (
        <DmsDirectoryPanel onSelectDirectory={handleSelectDirectory} />
      )}
    </div>
  );
};

export default DocumentsPage;
