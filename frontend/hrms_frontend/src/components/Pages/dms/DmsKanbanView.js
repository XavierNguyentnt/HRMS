// src/components/Pages/DMS/DmsKanbanView.js
import React from "react";
import { Card } from "react-bootstrap";
import { Folder } from "lucide-react";

// Component con cho card thư mục
const DirectoryCard = ({ dir, onNavigate }) => (
  <Card
    className="p-3 shadow-sm border-0 d-flex flex-column justify-content-center align-items-center"
    style={{ width: 220, height: 180, cursor: "pointer", borderRadius: "12px" }}
    onClick={() => onNavigate(dir, [])} // Path tạm rỗng, vì ta chỉ điều hướng 1 cấp
  >
    <Folder size={60} strokeWidth={1} className="text-primary mb-2" />
    <div className="fw-semibold text-truncate text-center w-100">
      {dir.name}
    </div>
  </Card>
);

// Component con cho card file
const FileCard = ({ doc }) => {
  const baseUrl =
    process.env.REACT_APP_ODOO_BASE_URL || "http://localhost:8069";
  return (
    <Card
      className="p-3 shadow-sm border-0"
      style={{
        width: 220,
        height: 180,
        cursor: "pointer",
        borderRadius: "12px",
      }}
      onClick={() =>
        window.open(
          `${baseUrl}${doc.access_url}`,
          "_blank",
          "noopener,noreferrer"
        )
      }>
      <img
        src={`${baseUrl}${doc.icon_url}`}
        alt="icon"
        style={{ height: 60, margin: "auto", objectFit: "contain" }}
      />
      <div className="mt-2 text-center">
        <div className="fw-semibold text-truncate">{doc.name}</div>
        <div className="text-muted small text-truncate">{doc.path_names}</div>
        <div className="text-muted small">{doc.human_size}</div>
      </div>
    </Card>
  );
};

const DmsKanbanView = ({ items, onNavigate }) => {
  return (
    <div className="d-flex flex-wrap gap-3">
      {items.map((item) =>
        item.type === "directory" ? (
          <DirectoryCard
            key={`dir-${item.id}`}
            dir={item}
            onNavigate={onNavigate}
          />
        ) : (
          <FileCard key={`file-${item.id}`} doc={item} />
        )
      )}
    </div>
  );
};

export default DmsKanbanView;
