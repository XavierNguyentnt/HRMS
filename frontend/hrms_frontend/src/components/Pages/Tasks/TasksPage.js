// src/components/Pages/Tasks/TasksPage.js (Tạo file và thư mục mới)
import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Container,
  Card,
  Spinner,
  Alert,
  Pagination,
  Row,
  Col,
} from "react-bootstrap";
import { fetchTasksByDomain } from "../../../services/odooAPI"; // Sẽ tạo hàm này
import TaskModal from "../task_components/TaskModal"; // Tái sử dụng TaskModal
import { useAuth } from "../../../contexts/AuthContext";

function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams] = useSearchParams();
  const { user } = useAuth(); // Lấy thông tin người dùng đang đăng nhập

  const [currentPage, setCurrentPage] = useState(1);
  const [totalTasks, setTotalTasks] = useState(0);
  const TASKS_PER_PAGE = 12;

  const filterType = searchParams.get("filter") || "all"; // 'my' hoặc 'all'

  const loadTasks = useCallback(
    async (page) => {
      setLoading(true);
      try {
        let domain = [];
        if (filterType === "my" && user.uid) {
          // Lọc các task mà người dùng hiện tại được giao
          domain = [["user_ids", "in", [user.uid]]];
        }

        const { tasks: taskData, total: totalData } = await fetchTasksByDomain({
          domain: domain,
          page: page,
          pageSize: TASKS_PER_PAGE,
        });

        setTasks(taskData);
        setTotalTasks(totalData);
      } catch (err) {
        setError("Không thể tải dữ liệu nhiệm vụ.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [filterType, user.uid]
  );

  useEffect(() => {
    loadTasks(currentPage);
  }, [loadTasks, currentPage]);

  const totalPages = Math.ceil(totalTasks / TASKS_PER_PAGE);

  const getPageTitle = () => {
    if (filterType === "my") return "Nhiệm vụ của tôi";
    return "Tất cả nhiệm vụ";
  };

  // --- RENDER ---
  if (loading)
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" />
      </Container>
    );
  if (error)
    return (
      <Container className="py-4">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );

  return (
    <Container fluid className="py-4">
      <h1>{getPageTitle()}</h1>

      {tasks.length === 0 ? (
        <Card className="p-3 text-center text-muted">
          Không có nhiệm vụ nào.
        </Card>
      ) : (
        <Row xs={1} md={2} lg={4} className="g-4">
          {tasks.map((task) => (
            <Col key={task.id}>
              <Card className="h-100">
                <Card.Body>
                  <Card.Title>{task.name}</Card.Title>
                  <Card.Subtitle className="mb-2 text-muted">
                    Dự án: {task.project_id ? task.project_id[1] : "N/A"}
                  </Card.Subtitle>
                  <Card.Text>
                    <strong>Người thực hiện:</strong>{" "}
                    {task.user_ids?.length
                      ? task.user_ids.map((u) => u[1]).join(", ")
                      : "-"}{" "}
                    <br />
                    <strong>Hạn chót:</strong> {task.date_deadline || "-"}
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {totalPages > 1 && (
        <div className="d-flex justify-content-center mt-4">
          <Pagination>{/* Pagination Logic */}</Pagination>
        </div>
      )}
    </Container>
  );
}

export default TasksPage;
