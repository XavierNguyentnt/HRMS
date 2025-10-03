// src/components/Pages/Tasks/TasksPage.js
import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Container,
  Spinner,
  Alert,
  Pagination,
  ButtonGroup,
  Button,
  InputGroup,
  FormControl,
  Card,
} from "react-bootstrap";
import {
  fetchTasksByDomain,
  fetchAllTaskStages,
  fetchTagsDetails,
  updateTask,
  deleteTask,
} from "../../../services/api";
import { useAuth, ROLES } from "../../../contexts/AuthContext";
import { cleanStageName } from "../../../util/formatters";
import TaskListItem from "../task_components/TaskListItem";
import TaskKanbanView from "../task_components/TaskKanbanView";
import ColumnFilter from "../project_components/ColumnFilter";
import {
  FaList,
  FaTh,
  FaSearch,
  FaAngleDown,
  FaAngleRight,
} from "react-icons/fa";

const ALL_TASK_COLUMNS = [
  { key: "name", label: "Tiêu đề", sortable: true },
  { key: "project_id", label: "Dự án", sortable: true },
  { key: "user_ids", label: "Người được phân công", sortable: false },
  { key: "date_deadline", label: "Thời hạn", sortable: true },
  { key: "priority_level", label: "Mức độ", sortable: true },
  { key: "progress", label: "Tiến độ", sortable: true },
  { key: "stage_id", label: "Giai đoạn", sortable: true },
];

function TasksPage() {
  const { user, role } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // States dữ liệu
  const [tasks, setTasks] = useState([]);
  const [groupedTasks, setGroupedTasks] = useState({});
  const [allStages, setAllStages] = useState([]);
  const [tagsMap, setTagsMap] = useState(new Map());

  // States giao diện
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("list");
  const [collapsedStages, setCollapsedStages] = useState({});

  // States điều khiển
  const [currentPage, setCurrentPage] = useState(1);
  const [totalTasks, setTotalTasks] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "date_deadline",
    direction: "desc",
  });
  const [visibleColumns, setVisibleColumns] = useState([
    "name",
    "project_id",
    "user_ids",
    "date_deadline",
    "priority_level",
    "stage_id",
  ]);

  const filterType = searchParams.get("filter") || "all";
  const TASKS_PER_PAGE = viewMode === "list" ? 20 : 1000;

  const loadData = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError(null);
      try {
        if (allStages.length === 0) {
          const stagesData = await fetchAllTaskStages();
          setAllStages(stagesData);
        }

        let domain = [];
        if (filterType === "my" && user.uid) {
          domain.push(["user_ids", "in", [user.uid]]);
        }
        if (searchTerm) {
          domain.push(["name", "ilike", searchTerm]);
        }

        const order = `${sortConfig.key} ${sortConfig.direction}`;

        const { tasks: taskData, total: totalData } = await fetchTasksByDomain({
          domain,
          page,
          pageSize: TASKS_PER_PAGE,
          order,
        });

        setTasks(taskData);
        setTotalTasks(totalData);
        setCurrentPage(page);

        const allTagIds = [
          ...new Set(taskData.flatMap((t) => t.tag_ids || [])),
        ];
        if (allTagIds.length > 0) {
          const tagsDetails = await fetchTagsDetails(allTagIds);
          setTagsMap(new Map(tagsDetails.map((tag) => [tag.id, tag])));
        }
      } catch (err) {
        setError("Không thể tải dữ liệu nhiệm vụ. Vui lòng thử lại.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [
      filterType,
      user.uid,
      searchTerm,
      sortConfig,
      TASKS_PER_PAGE,
      allStages.length,
    ]
  );

  // SỬA LỖI: Chỉ có một useEffect để gọi loadData
  useEffect(() => {
    loadData(1);
  }, [loadData]); // Dependency array bây giờ là loadData

  useEffect(() => {
    if (tasks.length > 0 && allStages.length > 0) {
      const groups = allStages.reduce((acc, stage) => {
        acc[stage.id] = tasks.filter(
          (t) => t.stage_id && t.stage_id[0] === stage.id
        );
        return acc;
      }, {});
      setGroupedTasks(groups);
    }
  }, [tasks, allStages]);

  const handleNavigateToTaskDetail = (taskId) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task && task.project_id) {
      navigate(`/projects/${task.project_id[0]}/tasks/${taskId}`);
    } else {
      console.warn("Task không có project_id để điều hướng:", task);
    }
  };

  // SỬA LỖI: Xóa hàm handlePageChange trùng lặp, chỉ giữ lại hàm này
  const handlePageChange = (page) => {
    loadData(page);
  };

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

  const reloadData = () => {
    const pageToReload = viewMode === "kanban" ? 1 : currentPage;
    loadData(pageToReload);
  };

  const handleInlineEditTask = async (editedTaskData) => {
    try {
      const dataToUpdate = { name: editedTaskData.name };
      await updateTask(editedTaskData.id, dataToUpdate);
      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task.id === editedTaskData.id ? editedTaskData : task
        )
      );
    } catch (err) {
      alert("Cập nhật nhiệm vụ thất bại: " + err.message);
      reloadData();
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa nhiệm vụ này?")) {
      try {
        await deleteTask(taskId);
        reloadData();
      } catch (err) {
        alert("Lỗi khi xóa nhiệm vụ: " + err.message);
      }
    }
  };

  const totalPages = Math.ceil(totalTasks / TASKS_PER_PAGE);
  const getPageTitle = () =>
    filterType === "my" ? "Nhiệm vụ của tôi" : "Tất cả nhiệm vụ";
  const orderedVisibleColumns = ALL_TASK_COLUMNS.filter((c) =>
    visibleColumns.includes(c.key)
  );

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

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1>{getPageTitle()}</h1>
        <ButtonGroup>
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
          Không có nhiệm vụ nào.
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
                {allStages.map(
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
            <TaskKanbanView
              tasks={tasks}
              stages={allStages}
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
    </Container>
  );
}

export default TasksPage;
