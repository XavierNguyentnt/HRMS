import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Spinner, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import * as odooApi from "../../../services/api";
import { FaUsers } from "react-icons/fa";

// Một mảng màu để hiển thị cho các thẻ Kanban, tương ứng với color index của Odoo
const KANBAN_COLORS = [
  "#FFFFFF",
  "#F06050",
  "#F4A460",
  "#F7CD1F",
  "#6CC1ED",
  "#814968",
  "#EB7E7F",
  "#2C8397",
  "#475577",
  "#D6145F",
  "#30C381",
  "#9365B8",
];

function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const data = await odooApi.fetchDepartments();
        setDepartments(data);
      } catch (error) {
        console.error("Failed to fetch departments:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadDepartments();
  }, []);

  // Hàm điều hướng đến trang nhân viên với bộ lọc theo phòng ban
  const viewEmployees = (departmentId, departmentName) => {
    navigate(
      `/employees?dept_id=${departmentId}&dept_name=${encodeURIComponent(
        departmentName
      )}`
    );
  };

  if (isLoading) {
    return (
      <Container className="text-center my-5">
        <Spinner animation="border" />
      </Container>
    );
  }

  return (
    <Container fluid className="p-4">
      <h1 className="mb-4">Phòng Ban</h1>
      <Row>
        {departments.map((dept) => (
          <Col md={4} lg={3} key={dept.id} className="mb-4">
            <Card
              className="h-100"
              style={{
                borderTop: `5px solid ${
                  KANBAN_COLORS[dept.color] || "#CCCCCC"
                }`,
              }}>
              <Card.Body className="d-flex flex-column">
                <div className="flex-grow-1">
                  <h4 className="fw-bold">{dept.name}</h4>
                  {dept.manager_id && (
                    <p className="text-muted mb-2">
                      Người phụ trách: {dept.manager_id[1]}
                    </p>
                  )}
                  {dept.company_id && (
                    <p className="text-muted small">
                      Đơn vị: {dept.company_id[1]}
                    </p>
                  )}
                </div>
                <Button
                  variant="primary"
                  className="mt-3 w-100"
                  onClick={() => viewEmployees(dept.id, dept.name)}>
                  <FaUsers className="me-2" />
                  {dept.total_employee} Nhân viên
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
}

export default DepartmentsPage;
