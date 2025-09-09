import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Spinner,
  Image,
  Form,
} from "react-bootstrap";
import { useSearchParams } from "react-router-dom"; // Import hook này
import * as odooApi from "../../../services/odooAPI";

function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Đọc tham số từ URL
  const [searchParams] = useSearchParams();
  const deptId = searchParams.get("dept_id");
  const deptName = searchParams.get("dept_name");

  useEffect(() => {
    const loadEmployees = async () => {
      setIsLoading(true);
      try {
        // Xây dựng domain (bộ lọc)
        let domain = [];
        if (searchTerm) {
          domain.push(["name", "ilike", searchTerm]);
        }
        if (deptId) {
          domain.push(["department_id", "=", parseInt(deptId)]);
        }

        const data = await odooApi.fetchEmployees({ domain, limit: 100 });
        setEmployees(data);
      } catch (error) {
        console.error("Failed to fetch employees:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const timerId = setTimeout(() => {
      loadEmployees();
    }, 500);

    return () => clearTimeout(timerId);
  }, [searchTerm, deptId]); // Thêm deptId vào dependencies

  return (
    <Container fluid className="p-4">
      {/* Hiển thị tiêu đề tương ứng */}
      <h2 className="mb-4">
        {deptName ? `Nhân viên: ${deptName}` : "Danh sách Nhân viên"}
      </h2>

      <Row className="mb-4">
        <Col md={6}>
          <Form.Control
            type="text"
            placeholder="Tìm kiếm nhân viên theo tên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Col>
      </Row>

      {isLoading ? (
        <div className="text-center">
          <Spinner animation="border" />
        </div>
      ) : (
        <Row>
          {employees.length > 0 ? (
            employees.map((emp) => (
              <Col md={4} lg={3} xl={2} key={emp.id} className="mb-4">
                <Card className="h-100 text-center employee-card">
                  <Card.Body>
                    <Image
                      src={
                        emp.image_128
                          ? `data:image/jpeg;base64,${emp.image_128}`
                          : "/default-avatar.png"
                      }
                      roundedCircle
                      style={{
                        width: "90px",
                        height: "90px",
                        objectFit: "cover",
                        marginBottom: "15px",
                        border: "3px solid #eee",
                      }}
                    />
                    <Card.Title as="h6" className="fw-bold">
                      {emp.name}
                    </Card.Title>
                    <Card.Text className="text-muted small">
                      {emp.job_title}
                    </Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            ))
          ) : (
            <p>Không tìm thấy nhân viên nào.</p>
          )}
        </Row>
      )}
    </Container>
  );
}

export default EmployeesPage;
