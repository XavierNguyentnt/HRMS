// src/components/Pages/Projects/ProjectDetailPage.js
import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Button,
  Container,
  Spinner,
  Alert,
  Breadcrumb,
  Pagination,
  ButtonGroup,
  Card,
  InputGroup,
  FormControl,
} from "react-bootstrap";
import {
  fetchTasksByProject,
  fetchProjectById,
  deleteTask,
  updateTask,
  fetchTaskStagesForProject,
  fetchTagsDetails,
} from "../../../services/api";
import { useAuth, ROLES } from "../../../contexts/AuthContext";
import { cleanStageName } from "../../../util/formatters";
import TaskModal from "../task_components/TaskModal";
import KanbanView from "../task_components/TaskKanbanView";
import ColumnFilter from "../project_components/ColumnFilter"; // Tái sử dụng ColumnFilter
import TaskListItem from "../task_components/TaskListItem"; // Component mới
import {
  FaList,
  FaTh,
  FaSearch,
  FaAngleDown,
  FaAngleRight,
} from "react-icons/fa";

// BƯỚC 1: ĐỊNH NGHĨA CÁC CỘT CHO BẢNG TASK
const ALL_TASK_COLUMNS = [
  { key: "id", label: "ID", sortable: true },
  { key: "name", label: "Tiêu đề", sortable: true },
  { key: "milestone_id", label: "Mốc thời gian", sortable: true },
  { key: "partner_id", label: "Khách hàng", sortable: true },
  { key: "parent_id", label: "Nhiệm vụ cha", sortable: true },
  { key: "user_ids", label: "Người được phân công", sortable: false },
  { key: "allocated_hours", label: "Thời gian phân bổ", sortable: true },
  { key: "effective_hours", label: "Thời gian đã dùng", sortable: true },
  {
    key: "subtask_effective_hours",
    label: "TG dùng cho NV phụ",
    sortable: true,
  },
  { key: "total_hours_spent", label: "Tổng TG đã dùng", sortable: true },
  { key: "remaining_hours", label: "Thời gian còn lại", sortable: true },
  { key: "progress", label: "Tiến độ", sortable: true },
  { key: "date_deadline", label: "Thời hạn", sortable: true },
  {
    key: "my_activity_date_deadline",
    label: "Thời hạn của tôi",
    sortable: true,
  },
  { key: "rating_last_text", label: "Đánh giá", sortable: true },
  { key: "tag_ids", label: "Thẻ", sortable: false },
  {
    key: "date_last_stage_update",
    label: "Cập nhật giai đoạn",
    sortable: true,
  },
  { key: "stage_id", label: "Giai đoạn", sortable: true },
  { key: "personal_stage_type_id", label: "Giai đoạn cá nhân", sortable: true },
];
function ProjectDetailPage() {
  const { user, role } = useAuth();
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [groupedTasks, setGroupedTasks] = useState({});
  const [taskStages, setTaskStages] = useState([]);
  const [tagsMap, setTagsMap] = useState(new Map());
  const [totalTasks, setTotalTasks] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [viewMode, setViewMode] = useState(
    localStorage.getItem(`projectViewMode_${projectId}`) || "list"
  );
  const navigate = useNavigate();
  const handleNavigateToTaskDetail = (taskId) => {
    navigate(`/projects/${projectId}/tasks/${taskId}`);
  };
  const [collapsedStages, setCollapsedStages] = useState({});

  // BƯỚC 2: THÊM CÁC STATE CHO VIỆC LỌC, SẮP XẾP, ẨN/HIỆN CỘT
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "sequence",
    direction: "asc",
  });
  const [visibleColumns, setVisibleColumns] = useState(
    JSON.parse(localStorage.getItem(`taskVisibleColumns_${projectId}`)) || [
      "name",
      "user_ids",
      "date_deadline",
      "progress",
    ]
  );

  const TASKS_PER_PAGE = viewMode === "list" ? 20 : 1000;

  useEffect(() => {
    localStorage.setItem(`projectViewMode_${projectId}`, viewMode);
    localStorage.setItem(
      `taskVisibleColumns_${projectId}`,
      JSON.stringify(visibleColumns)
    );
  }, [viewMode, visibleColumns, projectId]);

  // BƯỚC 3: CẬP NHẬT HÀM LOADTASKS
  const loadTasks = useCallback(
    async (page = 1) => {
      try {
        const domain = [];
        if (searchTerm) {
          domain.push(["name", "ilike", searchTerm]);
        }
        const order = `${sortConfig.key} ${sortConfig.direction}`;

        const { tasks: taskData, total: totalData } = await fetchTasksByProject(
          {
            projectId: parseInt(projectId),
            page,
            pageSize: TASKS_PER_PAGE,
            domain,
            order,
          }
        );

        setTasks(taskData);
        setTotalTasks(totalData);
        setCurrentPage(page);
        if (taskData.length > 0) {
          const allTagIds = [
            ...new Set(taskData.flatMap((t) => t.tag_ids || [])),
          ];
          if (allTagIds.length > 0) {
            const tagsDetails = await fetchTagsDetails(allTagIds);
            setTagsMap(new Map(tagsDetails.map((tag) => [tag.id, tag])));
          }
        }
      } catch (err) {
        setError("Không thể tải danh sách nhiệm vụ. Vui lòng thử lại.");
        console.error("Failed to load tasks", err);
      }
    },
    [projectId, TASKS_PER_PAGE, searchTerm, sortConfig]
  );

  // BƯỚC 4: THÊM USEEFFECT ĐỂ NHÓM TASK THEO STAGE
  useEffect(() => {
    const groups = taskStages.reduce((acc, stage) => {
      acc[stage.id] = tasks.filter(
        (task) => task.stage_id && task.stage_id[0] === stage.id
      );
      return acc;
    }, {});
    setGroupedTasks(groups);
  }, [tasks, taskStages]);

  const loadProjectData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [projData, stagesData] = await Promise.all([
        fetchProjectById(projectId),
        fetchTaskStagesForProject([parseInt(projectId)]),
      ]);
      setProject(projData);
      setTaskStages(stagesData);
      await loadTasks(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId, loadTasks]);

  useEffect(() => {
    loadProjectData();
  }, [loadProjectData]); // Chỉ phụ thuộc vào loadProjectData

  // BƯỚC 5: CÁC HÀM HANDLER MỚI
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const handleColumnToggle = (columnKey) => {
    setVisibleColumns((prev) =>
      prev.includes(columnKey)
        ? prev.filter((key) => key !== columnKey)
        : [...prev, columnKey]
    );
  };

  const toggleStageCollapse = (stageId) => {
    setCollapsedStages((prev) => ({ ...prev, [stageId]: !prev[stageId] }));
  };

  const handlePageChange = (pageNumber) => loadTasks(pageNumber);
  const totalPages = Math.ceil(totalTasks / TASKS_PER_PAGE);
  const handleOpenCreateModal = () => {
    setSelectedTask(null);
    setShowModal(true);
  };
  const handleInlineEditTask = async (editedTaskData) => {
    try {
      // Chỉ gửi những trường có thể thay đổi để tối ưu
      const dataToUpdate = {
        name: editedTaskData.name,
        // Thêm các trường khác nếu bạn cho phép sửa inline
      };

      await updateTask(editedTaskData.id, dataToUpdate);

      // Cập nhật lại state `tasks` để giao diện thay đổi ngay lập tức
      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task.id === editedTaskData.id ? editedTaskData : task
        )
      );
    } catch (err) {
      alert("Cập nhật nhiệm vụ thất bại: " + err.message);
      // Có thể tải lại dữ liệu để đảm bảo đồng bộ nếu lỗi
      reloadData();
    }
  };
  const handleOpenEditModal = (task) => {
    setSelectedTask(task);
    setShowModal(true);
  };
  const reloadData = () => {
    const pageToReload = viewMode === "kanban" ? 1 : currentPage;
    loadTasks(pageToReload);
  };
  const handleDeleteTask = async (taskId) => {
    if (window.confirm("...")) {
      try {
        await deleteTask(taskId);
        reloadData();
      } catch (err) {
        alert("Lỗi...");
      }
    }
  };
  const handleModalSave = () => {
    setShowModal(false);
    reloadData();
  };

  if (loading)
    return (
      <Container className="text-center p-5">
        <Spinner animation="border" />
      </Container>
    );
  if (error)
    return (
      <Container className="py-4">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  if (!project) return <Container>Không tìm thấy dự án</Container>;

  const orderedVisibleColumns = ALL_TASK_COLUMNS.filter((c) =>
    visibleColumns.includes(c.key)
  );

  // BƯỚC 6: CẬP NHẬT GIAO DIỆN RENDER
  return (
    <Container fluid className="py-4">
      <Breadcrumb>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/projects" }}>
          Dự án
        </Breadcrumb.Item>
        <Breadcrumb.Item active>{project.name}</Breadcrumb.Item>
      </Breadcrumb>
      <h1>{project.name}</h1>
      {/* ... Project details <p> tag ... */}

      <div className="d-flex justify-content-between align-items-center mt-4 mb-3">
        <h3>Nhiệm vụ</h3>
        <div>
          <ButtonGroup className="me-3">
            <Button
              variant={viewMode === "list" ? "primary" : "outline-secondary"}
              onClick={() => setViewMode("list")}>
              <FaList />
            </Button>
            <Button
              variant={viewMode === "kanban" ? "primary" : "outline-secondary"}
              onClick={() => setViewMode("kanban")}>
              <FaTh />
            </Button>
          </ButtonGroup>
          <Button onClick={handleOpenCreateModal} variant="primary">
            <i className="fa fa-plus me-2"></i> Tạo mới
          </Button>
        </div>
      </div>

      {viewMode === "list" && (
        <div className="p-3 mb-3 bg-light border rounded d-flex justify-content-between">
          <InputGroup style={{ maxWidth: "400px" }}>
            <InputGroup.Text>
              <FaSearch />
            </InputGroup.Text>
            <FormControl
              placeholder="Tìm theo tên nhiệm vụ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
          <ColumnFilter
            columns={ALL_TASK_COLUMNS}
            visibleColumns={visibleColumns}
            onColumnToggle={handleColumnToggle}
          />
        </div>
      )}

      {tasks.length === 0 ? (
        <Card className="p-3 text-center text-muted">
          Chưa có nhiệm vụ nào được tạo.
        </Card>
      ) : (
        <>
          {viewMode === "list" ? (
            <div className="table-sticky-container">
              <table className="table table-bordered table-hover table-striped unified-table project-task-table">
                <thead className="table-header">
                  <tr>
                    {orderedVisibleColumns.map((col) => (
                      <th
                        key={col.key}
                        onClick={() => col.sortable && handleSort(col.key)}
                        style={{
                          cursor: col.sortable ? "pointer" : "default",
                        }}>
                        {col.label}
                        {sortConfig.key === col.key && (
                          <span className="ms-1">
                            {sortConfig.direction === "asc" ? "▲" : "▼"}
                          </span>
                        )}
                      </th>
                    ))}
                    <th>Hành động</th>
                  </tr>
                </thead>
                {taskStages.map(
                  (stage) =>
                    groupedTasks[stage.id]?.length > 0 && (
                      <tbody key={stage.id} className="table-group">
                        <tr
                          className="table-group-header"
                          onClick={() => toggleStageCollapse(stage.id)}>
                          <th colSpan={orderedVisibleColumns.length + 1}>
                            {collapsedStages[stage.id] ? (
                              <FaAngleRight />
                            ) : (
                              <FaAngleDown />
                            )}
                            {/* ÁP DỤNG HÀM Ở ĐÂY */}
                            <span className="ms-2">
                              {cleanStageName(stage.name)}
                            </span>
                            <span className="badge bg-secondary rounded-pill ms-2">
                              {groupedTasks[stage.id].length}
                            </span>
                          </th>
                        </tr>
                        {!collapsedStages[stage.id] &&
                          groupedTasks[stage.id].map((task) => {
                            // TÍNH TOÁN QUYỀN TRÊN MỖI TASK
                            const canEditAll =
                              role === ROLES.ADMIN ||
                              user?.uid === task.create_uid?.[0];

                            return (
                              <TaskListItem
                                key={task.id}
                                task={task}
                                canEditAll={canEditAll}
                                visibleColumns={orderedVisibleColumns}
                                tagsMap={tagsMap}
                                onNavigate={handleNavigateToTaskDetail}
                                onDelete={handleDeleteTask}
                                onInlineEdit={handleInlineEditTask}
                              />
                            );
                          })}
                      </tbody>
                    )
                )}
              </table>
            </div>
          ) : (
            <KanbanView
              tasks={tasks}
              stages={taskStages}
              onTaskUpdate={reloadData}
            />
          )}
        </>
      )}

      {viewMode === "list" && totalPages > 1 && (
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
