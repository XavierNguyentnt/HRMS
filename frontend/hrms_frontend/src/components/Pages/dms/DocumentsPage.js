// src/components/Pages/dms/DocumentsPage.js
import React, { useState, useEffect } from "react";
import { Container, Table, Button, Spinner } from "react-bootstrap";
import * as dmsApi from "../../../services/api/dmsAPI"; // ✅ đường dẫn đúng

function DocumentsPage() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dmsApi
      .fetchDocuments()
      .then(setDocs)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner animation="border" />;

  return (
    <Container className="p-4">
      <h2>Quản lý Văn bản</h2>
      <Button variant="primary" className="mb-3">
        Thêm mới
      </Button>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Số hiệu</th>
            <th>Trích yếu</th>
            <th>Phòng ban</th>
            <th>Trạng thái</th>
            <th>Ngày nhận</th>
          </tr>
        </thead>
        <tbody>
          {docs.map((doc) => (
            <tr key={doc.id}>
              <td>{doc.ref_no}</td>
              <td>{doc.name}</td>
              <td>{doc.department_id?.[1]}</td>
              <td>{doc.status}</td>
              <td>{doc.date_received}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
}

export default DocumentsPage;
