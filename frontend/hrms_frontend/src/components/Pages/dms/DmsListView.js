import React from "react";
import { Table } from "react-bootstrap";

const DmsListView = ({ documents }) => {
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
          <tr key={doc.id}>
            <td>
              <img
                src={`${baseUrl}${doc.icon_url}`}
                alt=""
                style={{ width: 50, marginRight: 8 }}
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
            <td>{doc.path_names}</td>
            <td>{doc.human_size}</td>
            <td>{doc.create_uid?.[1]}</td>
            <td>{doc.create_date}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

export default DmsListView;
