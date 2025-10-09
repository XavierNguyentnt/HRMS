// src/components/Pages/DMS/DocumentsPage.js
import React, { useState, useEffect, useMemo } from "react";
import { fetchDocuments } from "../../../services/api/dmsAPI";
import DmsToolbar from "./DmsToolbar";
import DmsListView from "./DmsListView";
import DmsKanbanView from "./DmsKanbanView";
import DmsUploadModal from "./DmsUploadModal";
import DmsNewFileModal from "./DmsNewFileModal";
import { Button, Spinner } from "react-bootstrap";
import { Upload, Plus } from "lucide-react";

const DocumentsPage = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState("kanban"); // "kanban" | "list"
  const [showUpload, setShowUpload] = useState(false);
  const [showNewFile, setShowNewFile] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    field: "create_date",
    order: "desc",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });

  // 📂 Load danh sách file từ Odoo
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

  // 🔍 Lọc và sắp xếp dữ liệu
  const filteredDocs = useMemo(() => {
    return documents
      .filter((doc) => {
        const term = searchTerm.toLowerCase();
        const matchSearch =
          doc.name?.toLowerCase().includes(term) ||
          doc.path_names?.toLowerCase().includes(term) ||
          doc.create_uid?.[1]?.toLowerCase().includes(term);

        // 🔍 Lọc theo ngày
        const docDate = new Date(doc.create_date);
        const fromOK = dateRange.from
          ? docDate >= new Date(dateRange.from)
          : true;
        const toOK = dateRange.to
          ? docDate <= new Date(dateRange.to + "T23:59:59")
          : true;

        return matchSearch && fromOK && toOK;
      })
      .sort((a, b) => {
        const { field, order } = sortConfig;
        const parseSize = (v) => {
          if (!v || typeof v !== "string") return 0;
          const [num, unit] = v.split(" ");
          const n = parseFloat(num);
          if (unit === "KB") return n * 1024;
          if (unit === "MB") return n * 1024 * 1024;
          return n || 0;
        };
        let valA = a[field];
        let valB = b[field];

        if (field === "create_date") {
          valA = new Date(a.create_date);
          valB = new Date(b.create_date);
        } else if (field === "human_size") {
          valA = parseSize(a.human_size);
          valB = parseSize(b.human_size);
        } else if (Array.isArray(valA)) {
          valA = valA[1] || "";
          valB = valB[1] || "";
        }

        if (valA < valB) return order === "asc" ? -1 : 1;
        if (valA > valB) return order === "asc" ? 1 : -1;
        return 0;
      });
  }, [documents, searchTerm, sortConfig, dateRange]);

  return (
    <div className="container-fluid py-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="fw-bold">📁 Quản lý tài liệu</h4>
        <div className="d-flex gap-2">
          <Button variant="success" onClick={() => setShowNewFile(true)}>
            <Plus size={16} className="me-1" /> Tạo mới
          </Button>
          <Button variant="primary" onClick={() => setShowUpload(true)}>
            <Upload size={16} className="me-1" /> Upload
          </Button>
        </div>
      </div>

      {/* 🧭 Toolbar: Search + Sort + View Switch */}
      <DmsToolbar
        onSearch={setSearchTerm}
        onSortChange={setSortConfig}
        onViewChange={setViewMode}
        onDateFilter={setDateRange}
        currentView={viewMode}
      />

      {/* 📄 Danh sách hoặc Kanban */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="text-center text-muted py-5">
          Không có tài liệu nào.
        </div>
      ) : viewMode === "list" ? (
        <DmsListView documents={filteredDocs} />
      ) : (
        <DmsKanbanView documents={filteredDocs} />
      )}

      {/* 📤 Modal tạo mới / upload */}
      <DmsNewFileModal
        show={showNewFile}
        onHide={() => setShowNewFile(false)}
        onSuccess={loadDocuments}
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
