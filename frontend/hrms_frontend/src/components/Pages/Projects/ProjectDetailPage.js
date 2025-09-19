import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Button,
  Container,
  Row,
  Col,
  Card,
  Spinner,
  Alert,
  Breadcrumb,
  Pagination,
} from "react-bootstrap";
import {
  fetchTasksByProject,
  fetchProjectById,
  deleteTask,
} from "../../../services/odooAPI";
import TaskModal from "../../Pages/project_components/TaskModal";

function ProjectDetailPage() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [totalTasks, setTotalTasks] = useState(0); // State mới để lưu tổng số task
  const [currentPage, setCurrentPage] = useState(1); // State cho trang hiện tại
  const TASKS_PER_PAGE = 10; // Giới hạn 10 task mỗi trang
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const loadTasks = useCallback(
    async (page) => {
      try {
        // Gọi API với tham số phân trang
        const { tasks: taskData, total: totalData } = await fetchTasksByProject(
          {
            projectId: parseInt(projectId),
            page: page,
            pageSize: TASKS_PER_PAGE,
          }
        );
        setTasks(taskData);
        setTotalTasks(totalData);
      } catch (err) {
        setError("Không thể tải danh sách nhiệm vụ. Vui lòng thử lại.");
        console.error("Failed to load tasks", err);
      }
    },
    [projectId]
  );

  const loadProjectData = async (page) => {
    setLoading(true);
    setError(null);
    try {
      // Tối ưu hóa: Gọi thẳng API để lấy chi tiết dự án, không cần fetch tất cả
      const projData = await fetchProjectById(projectId);
      setProject(projData);
      await loadTasks(page);
    } catch (err) {
      setError(err.message);
      console.error("Error loading project data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    loadProjectData(1);
  }, [projectId, loadTasks]);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    loadTasks(pageNumber);
  };

  const totalPages = Math.ceil(totalTasks / TASKS_PER_PAGE);

  const handleOpenCreateModal = () => {
    setSelectedTask(null); // Đặt selectedTask là null để modal biết đây là chế độ "Tạo mới"
    setShowModal(true);
  };

  const handleOpenEditModal = (task) => {
    setSelectedTask(task); // Truyền thông tin task cần sửa vào modal
    setShowModal(true);
  };

  const handleDeleteTask = async (taskId) => {
    // Luôn hỏi xác nhận trước khi xóa
    if (window.confirm("Bạn có chắc chắn muốn xóa nhiệm vụ này không?")) {
      try {
        await deleteTask(taskId);
        await loadTasks(); // Tải lại danh sách task sau khi xóa thành công
      } catch (err) {
        alert("Lỗi khi xóa nhiệm vụ: " + err.message);
      }
    }
  };

  const handleModalSave = () => {
    setShowModal(false); // Đóng modal
    loadTasks(); // Tải lại danh sách tasks để cập nhật thay đổi
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-4">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  if (!project) return <Container>Không tìm thấy dự án</Container>;

  return (
    <Container className="py-4">
      {/* Breadcrumb để điều hướng ngược lại */}
      <Breadcrumb>
        <Breadcrumb.Item as={Link} to="/projects">
          Dự án
        </Breadcrumb.Item>
        <Breadcrumb.Item active>
          {project ? project.name : "Chi tiết"}
        </Breadcrumb.Item>
      </Breadcrumb>

      {/* Thông tin dự án */}
      <h1>{project.name}</h1>
      <p>
        <strong>Manager:</strong>{" "}
        {project.user_id ? project.user_id[1] : "Chưa có"} <br />
        <strong>Start Date:</strong> {project.date_start || "-"} <br />
        <strong>End Date:</strong> {project.date || "-"}
      </p>

      {/* Header của khu vực Tasks */}
      <div className="d-flex justify-content-between align-items-center mt-4 mb-3">
        <h3>Nhiệm vụ</h3>
        <Button onClick={handleOpenCreateModal} variant="primary">
          <i className="fa fa-plus me-2"></i> Tạo mới
        </Button>
      </div>

      {/* Danh sách Tasks */}
      {tasks.length === 0 ? (
        <Card className="p-3 text-center text-muted">
          Chưa có nhiệm vụ nào được tạo.
        </Card>
      ) : (
        <Row xs={1} md={2} lg={3} className="g-4">
          {tasks.map((task) => (
            <Col key={task.id}>
              <Card className="h-100">
                <Card.Body className="d-flex flex-column">
                  <Card.Title>{task.name}</Card.Title>
                  <Card.Text as="div" className="flex-grow-1">
                    <div>
                      <strong>Người thực hiện:</strong>{" "}
                      {/* Kiểm tra xem task.user_ids có tồn tại và có phần tử không */}
                      {task.user_ids && task.user_ids.length > 0
                        ? task.user_ids.map((user) => user[1]).join(", ") // Lấy tên của tất cả user và nối chuỗi
                        : "-"}
                    </div>
                    <div>
                      <strong>Giai đoạn:</strong>{" "}
                      {task.stage_id ? task.stage_id[1] : "-"}
                    </div>
                    <div>
                      <strong>Hạn chót:</strong> {task.date_deadline || "-"}
                    </div>
                    <div>
                      <strong>Ưu tiên:</strong>
                      <span
                        className="ms-2"
                        style={{ textTransform: "capitalize" }}>
                        {task.priority_level || "-"}
                      </span>
                    </div>
                  </Card.Text>
                  <div className="mt-3">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => handleOpenEditModal(task)}>
                      Sửa
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      className="ms-2"
                      onClick={() => handleDeleteTask(task.id)}>
                      Xóa
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Component Pagination */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-center mt-4">
          <Pagination>
            <Pagination.Prev
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            />
            {[...Array(totalPages).keys()].map((number) => (
              <Pagination.Item
                key={number + 1}
                active={number + 1 === currentPage}
                onClick={() => handlePageChange(number + 1)}>
                {number + 1}
              </Pagination.Item>
            ))}
            <Pagination.Next
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            />
          </Pagination>
        </div>
      )}

      {/* Render Modal (component này sẽ không hiển thị trừ khi show=true) */}
      <TaskModal
        show={showModal}
        onHide={() => setShowModal(false)}
        projectId={parseInt(projectId)}
        task={selectedTask}
        onSave={handleModalSave}
      />
    </Container>
  );
}

export default ProjectDetailPage;
