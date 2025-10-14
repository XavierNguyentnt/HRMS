// src/components/Pages/DMS/DmsKanbanView.js
import React from "react";
import { Card } from "react-bootstrap";
import { Folder } from "lucide-react";

// Component con cho card thư mục
const DirectoryCard = ({ dir, onNavigate, onContextMenu, breadcrumbPath }) => (
  <Card
    className="p-3 shadow-sm border-0 d-flex flex-column justify-content-center align-items-center"
    style={{ width: 220, height: 180, cursor: "pointer", borderRadius: "12px" }}
    onClick={() => onNavigate(dir, [...breadcrumbPath, dir])} // Path tạm rỗng, vì ta chỉ điều hướng 1 cấp
    onContextMenu={(e) => onContextMenu(e, { ...dir, type: "directory" })}>
    <Folder size={60} strokeWidth={1} className="text-primary mb-2" />
    <div className="fw-semibold text-truncate text-center w-100">
      {dir.name}
    </div>
  </Card>
);

// Component con cho card file
const FileCard = ({ doc, onContextMenu }) => {
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
      }
      onContextMenu={(e) => onContextMenu(e, { ...doc, type: "file" })}>
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

const DmsKanbanView = ({
  immediateItems,
  allItems,
  onNavigate,
  onContextMenu,
  breadcrumbPath,
}) => {
  return (
    <div>
      {/* ===== KHU VỰC TRÊN ===== */}
      <div className="mb-4">
        <h5 className="fw-bold text-muted mb-3">Thư mục và Tệp tin</h5>
        {immediateItems && immediateItems.length > 0 ? (
          <div className="d-flex flex-wrap gap-3">
            {immediateItems.map((item) =>
              item.type === "directory" ? (
                <DirectoryCard
                  key={`dir-${item.id}`}
                  dir={item}
                  onNavigate={onNavigate}
                  onContextMenu={onContextMenu}
                  breadcrumbPath={breadcrumbPath}
                />
              ) : (
                <FileCard
                  key={`file-${item.id}`}
                  doc={item}
                  onContextMenu={onContextMenu}
                />
              )
            )}
          </div>
        ) : (
          <p className="text-muted fst-italic">
            Không có thư mục con hoặc tệp tin trực tiếp.
          </p>
        )}
      </div>

      <hr />

      {/* ===== KHU VỰC DƯỚI ===== */}
      <div className="mt-4">
        <h5 className="fw-bold text-muted mb-3">Tất cả Tệp tin</h5>
        {allItems && allItems.length > 0 ? (
          <div className="d-flex flex-wrap gap-3">
            {allItems.map((item) => (
              <FileCard
                key={`all-file-${item.id}`}
                doc={item}
                onContextMenu={onContextMenu}
              />
            ))}
          </div>
        ) : (
          <p className="text-muted fst-italic">
            Không có tệp tin nào trong thư mục này.
          </p>
        )}
      </div>
    </div>
  );
};

export default DmsKanbanView;
