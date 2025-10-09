import React, { useState, useMemo } from "react";
import { Table } from "react-bootstrap";
import { ArrowUp, ArrowDown } from "lucide-react";

const DmsListView = ({ documents }) => {
  const baseUrl =
    process.env.REACT_APP_ODOO_BASE_URL || "http://localhost:8069";

  const [sortConfig, setSortConfig] = useState({
    key: "create_date",
    direction: "desc",
  });

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      } else {
        return { key, direction: "asc" };
      }
    });
  };

  // ✅ Hàm chuyển "2.3 MB", "800 KB", "512 B" thành bytes để sort đúng
  const parseSizeToBytes = (val) => {
    if (!val || typeof val !== "string") return 0;
    const match = val.match(/([\d.]+)\s*(B|KB|MB|GB|TB)?/i);
    if (!match) return 0;
    const num = parseFloat(match[1]);
    const unit = match[2]?.toUpperCase() || "B";
    const units = {
      B: 1,
      KB: 1024,
      MB: 1024 ** 2,
      GB: 1024 ** 3,
      TB: 1024 ** 4,
    };
    return num * (units[unit] || 1);
  };

  const sortedDocuments = useMemo(() => {
    const sorted = [...documents];
    sorted.sort((a, b) => {
      const { key, direction } = sortConfig;
      let valA = a[key];
      let valB = b[key];

      // ✅ Kiểm tra kiểu dữ liệu và so sánh chính xác
      if (key === "create_date") {
        valA = new Date(a.create_date);
        valB = new Date(b.create_date);
      } else if (key === "human_size") {
        valA = parseSizeToBytes(a.human_size);
        valB = parseSizeToBytes(b.human_size);
      } else if (Array.isArray(valA)) {
        valA = valA[1] || "";
        valB = valB[1] || "";
      } else if (typeof valA === "string" && typeof valB === "string") {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return direction === "asc" ? -1 : 1;
      if (valA > valB) return direction === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [documents, sortConfig]);

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? (
      <ArrowUp size={14} className="ms-1" />
    ) : (
      <ArrowDown size={14} className="ms-1" />
    );
  };

  return (
    <Table bordered hover responsive className="align-middle">
      <thead className="table-light">
        <tr>
          <th onClick={() => handleSort("name")} style={{ cursor: "pointer" }}>
            Tên tệp {getSortIcon("name")}
          </th>
          <th
            onClick={() => handleSort("path_names")}
            style={{ cursor: "pointer" }}>
            Thư mục {getSortIcon("path_names")}
          </th>
          <th
            onClick={() => handleSort("human_size")}
            style={{ cursor: "pointer" }}>
            Kích thước {getSortIcon("human_size")}
          </th>
          <th
            onClick={() => handleSort("create_uid")}
            style={{ cursor: "pointer" }}>
            Người tạo {getSortIcon("create_uid")}
          </th>
          <th
            onClick={() => handleSort("create_date")}
            style={{ cursor: "pointer" }}>
            Ngày tạo {getSortIcon("create_date")}
          </th>
        </tr>
      </thead>
      <tbody>
        {sortedDocuments.map((doc) => (
          <tr key={doc.id}>
            <td>
              <img
                src={`${baseUrl}${doc.icon_url}`}
                alt=""
                style={{ width: 40, marginRight: 8, verticalAlign: "middle" }}
                onError={(e) =>
                  (e.target.src = `${baseUrl}/dms/static/icons/file_unknown.svg`)
                }
              />
              <a
                href={`${baseUrl}${doc.access_url}`}
                target="_blank"
                rel="noopener noreferrer">
                {doc.name}
              </a>
            </td>
            <td>{doc.path_names?.split("/")[0] || "—"}</td>
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
