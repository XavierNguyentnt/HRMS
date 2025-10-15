// src/components/Pages/DMS/DmsListView.js (Đã cập nhật)
import React from "react";
import { Table, Button } from "react-bootstrap";

const DmsListView = ({
  documents,
  onNavigate,
  onContextMenu,
  selectedItems,
  onItemClick,
  onItemDoubleClick,
}) => {
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
        {documents.map((doc) => {
          // 👇 Xác định item có được chọn hay không
          const isSelected = selectedItems.some((item) => item.id === doc.id);
          return (
            <tr
              key={doc.id}
              className={isSelected ? "table-primary" : ""} // 👈 Dùng class của Bootstrap để highlight
              onContextMenu={(e) => onContextMenu(e, { ...doc, type: "file" })}
              onClick={(e) => onItemClick(e, { ...doc, type: "file" })} // 👈 Dùng onClick mới
              onDoubleClick={() => onItemDoubleClick({ ...doc, type: "file" })} // 👈 Dùng onDoubleClick
            >
              <td>
                {/* Thay thẻ <a> bằng <span> để không bị điều hướng khi single click */}
                <span className="fw-medium" style={{ cursor: "pointer" }}>
                  {doc.name}
                </span>
              </td>
              <td>
                {doc.directory_id ? (
                  <Button
                    variant="link"
                    className="p-0 text-start"
                    // Ngăn sự kiện click của dòng và điều hướng luôn
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate(
                        { id: doc.directory_id[0], name: doc.directory_id[1] },
                        []
                      );
                    }}>
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
          );
        })}
      </tbody>
    </Table>
  );
};

export default DmsListView;
