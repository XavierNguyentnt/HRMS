// src/components/Pages/DMS/DmsListView.js (Đã cập nhật)
import React from "react";
import { Table, Button } from "react-bootstrap";

const DmsListView = ({ documents, onNavigate, onContextMenu }) => {
  const baseUrl =
    process.env.REACT_APP_ODOO_BASE_URL || "http://localhost:8069";

  return (
    <Table bordered hover responsive className="align-middle">
      <thead className="table-light">
        <tr>
          <th>Tên tệp</th>
          <th>Thư mục</th>
          <th>Kích thước</th>
          <th>Người tạo</th>
          <th>Ngày tạo</th>
        </tr>
      </thead>
      <tbody>
        {documents.map((doc) => (
          <tr
            key={doc.id}
            onContextMenu={(e) => onContextMenu(e, { ...doc, type: "file" })}>
            <td>
              <a
                href={`${baseUrl}${doc.access_url}`}
                target="_blank"
                rel="noopener noreferrer">
                {doc.name}
              </a>
            </td>
            <td>
              {doc.directory_id ? (
                <Button
                  variant="link"
                  className="p-0 text-start"
                  onClick={() =>
                    onNavigate(
                      { id: doc.directory_id[0], name: doc.directory_id[1] },
                      []
                    )
                  }>
                  {doc.directory_id[1]}
                </Button>
              ) : (
                "—"
              )}
            </td>
            <td>{doc.human_size || "—"}</td>
            <td>{doc.create_uid?.[1] || "—"}</td>
            <td>{new Date(doc.create_date).toLocaleString("vi-VN")}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

export default DmsListView;
