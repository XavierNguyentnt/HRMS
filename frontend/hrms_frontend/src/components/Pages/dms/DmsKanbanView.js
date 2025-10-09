import React from "react";
import { Card } from "react-bootstrap";

const DmsKanbanView = ({ documents }) => {
  const baseUrl =
    process.env.REACT_APP_ODOO_BASE_URL || "http://localhost:8069";

  return (
    <div className="d-flex flex-wrap gap-3">
      {documents.map((doc) => (
        <Card
          key={doc.id}
          className="p-3 shadow-sm border-0"
          style={{
            width: 220,
            cursor: "pointer",
            borderRadius: "12px",
            transition: "all 0.2s ease-in-out",
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
            style={{ width: 80, margin: "auto" }}
            onError={(e) =>
              (e.target.src = `${baseUrl}/dms/static/icons/file_unknown.svg`)
            }
          />
          <div className="mt-2 text-center">
            <div className="fw-semibold text-truncate">{doc.name}</div>
            <div className="text-muted small text-truncate">
              {doc.path_names}
            </div>
            <div className="text-muted small">{doc.human_size}</div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default DmsKanbanView;
