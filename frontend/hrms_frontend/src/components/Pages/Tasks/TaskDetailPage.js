// src/components/Pages/Tasks/TaskDetailPage.js
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Container,
  Spinner,
  Alert,
  Breadcrumb,
  Card,
  Row,
  Col,
  Button,
  Tabs,
  Tab,
} from "react-bootstrap";
import {
  fetchTaskDetails,
  archiveTask,
  fetchTaskStagesForProject,
} from "../../../services/api";
// import TaskStatusbar from "../task_components/TaskStatusbar";
import StatusIndicator from "../project_components/StatusIndicator";
import Chatter from "../task_components/Chatter";
// import TaskEditForm from './TaskEditForm'; // Sẽ tạo form sửa sau

const TaskDetailPage = () => {
  const { projectId, taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [taskStages, setTaskStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false); // State quản lý chế độ sửa

  const loadTaskData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [taskData, stagesData] = await Promise.all([
        fetchTaskDetails(parseInt(taskId)),
        fetchTaskStagesForProject([parseInt(projectId)]),
      ]);

      if (taskData) {
        setTask(taskData);
        setTaskStages(stagesData);
      } else {
        setError("Không tìm thấy nhiệm vụ.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [taskId, projectId]);

  useEffect(() => {
    loadTaskData();
  }, [loadTaskData]);

  const handleDelete = async () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa nhiệm vụ này?")) {
      try {
        await archiveTask(task.id);
        navigate(`/projects/${projectId}`);
      } catch (err) {
        alert("Lỗi khi xóa nhiệm vụ: " + err.message);
      }
    }
  };

  if (loading)
    return (
      <Container className="text-center p-5">
        <Spinner />
      </Container>
    );
  if (error)
    return (
      <Container className="p-4">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  if (!task) return null;

  return (
    <Container fluid className="py-4">
      <Breadcrumb>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/projects" }}>
          Dự án
        </Breadcrumb.Item>
        <Breadcrumb.Item
          linkAs={Link}
          linkProps={{ to: `/projects/${projectId}` }}>
          {task.project_id[1]}
        </Breadcrumb.Item>
        <Breadcrumb.Item active>{task.name}</Breadcrumb.Item>
      </Breadcrumb>
      {/* 4. THÊM STATUSBAR VÀO GIAO DIỆN */}
      {/* <TaskStatusbar
        allStages={taskStages}
        currentStageId={task.stage_id?.[0]}
      /> */}
      <Row>
        <Col md={8}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h1>{task.name}</h1>
            <div>
              {isEditing ? (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => setIsEditing(false)}
                    className="me-2">
                    Hủy
                  </Button>
                  <Button variant="primary">Lưu</Button>
                </>
              ) : (
                <>
                  <Button
                    variant="primary"
                    onClick={() => setIsEditing(true)}
                    className="me-2">
                    Chỉnh sửa
                  </Button>
                  <Button variant="danger" onClick={handleDelete}>
                    Xóa
                  </Button>
                </>
              )}
            </div>
          </div>

          {isEditing ? (
            <Card body className="p-4 bg-light">
              <p>Giao diện Form Sửa sẽ được hiển thị ở đây.</p>
            </Card>
          ) : (
            <>
              <Card>
                <Card.Header>
                  <strong>Thông tin chi tiết</strong>
                </Card.Header>
                <Card.Body>
                  {/* 5. BỔ SUNG THÔNG TIN VÀ TÁI SỬ DỤNG STATUSINDICATOR */}
                  <p className="d-flex justify-content-left align-items-center gap-3">
                    <strong>Trạng thái:</strong>
                    <StatusIndicator
                      stage={task.stage_id}
                      isFolded={task.is_closed}
                    />
                  </p>
                  <p>
                    <strong>Người được phân công:</strong>{" "}
                    {task.portal_user_names || "Chưa có"}
                  </p>
                  <p>
                    <strong>Người giao việc:</strong>{" "}
                    {task.partner_id ? task.partner_id[1] : "Chưa có"}
                  </p>
                  <p>
                    <strong>Hạn hoàn thành:</strong>{" "}
                    {task.date_deadline || "Chưa có"}
                  </p>
                  <p>
                    <strong>Ưu tiên:</strong>{" "}
                    {task.priority === "1" ? "Cao" : "Thấp"}
                  </p>
                </Card.Body>
              </Card>
              <Tabs defaultActiveKey="description" className="mb-3">
                <Tab eventKey="description" title="Mô tả">
                  <Card body>
                    <div
                      dangerouslySetInnerHTML={{
                        __html: task.description || "Chưa có mô tả.",
                      }}
                    />
                  </Card>
                </Tab>
                <Tab eventKey="timesheets" title="Bảng chấm công" disabled>
                  <Card body>Sẽ được phát triển ở Giai đoạn 2.</Card>
                </Tab>
                <Tab eventKey="subtasks" title="Nhiệm vụ phụ" disabled>
                  <Card body>Sẽ được phát triển ở Giai đoạn 2.</Card>
                </Tab>
              </Tabs>
            </>
          )}
        </Col>
        <Col md={4}>
          <Chatter
            resModel="project.task"
            resId={task.id}
            initialFollowerIds={task.message_follower_ids}
            onUpdate={loadTaskData}
          />
        </Col>
      </Row>
    </Container>
  );
};

export default TaskDetailPage;
