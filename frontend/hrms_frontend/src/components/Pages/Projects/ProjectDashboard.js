// src/components/Pages/Projects/ProjectDashboard.js
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Button,
  Spinner,
  Alert,
  InputGroup,
  FormControl,
  Row,
  Col,
  Form,
  ButtonGroup,
} from "react-bootstrap";
import {
  fetchProjectsWithDetail,
  fetchAllProjectStages,
  createProject,
  updateProject,
  deleteProject,
  fetchUsers,
} from "../../../services/api";
import { useAuth, ROLES } from "../../../contexts/AuthContext";
import ProjectListItem from "../project_components/ProjectListItem";
import ProjectModal from "../project_components/ProjectModal";
import ColumnFilter from "../project_components/ColumnFilter";
import ProjectKanbanView from "../project_components/ProjectKanbanView";
import {
  FaSearch,
  FaList,
  FaTh,
  FaAngleDown, // THÊM MỚI
  FaAngleRight, // THÊM MỚI
} from "react-icons/fa";

const ALL_COLUMNS = [
  // ... giữ nguyên
  {
    key: "display_name",
    label: "Tiêu đề",
    sortable: true,
    className: "col-name",
  },
  {
    key: "partner_id",
    label: "Khách hàng",
    sortable: false,
    className: "col-customer",
  },
  {
    key: "company_id",
    label: "Công ty",
    sortable: false,
    className: "col-company",
  },
  {
    key: "date_start",
    label: "Ngày theo kế hoạch",
    sortable: true,
    className: "col-date",
  },
  {
    key: "milestone_progress",
    label: "Tiến độ Milestones",
    sortable: true,
    className: "col-progress",
  },
  {
    key: "user_id",
    label: "Trưởng dự án",
    sortable: true,
    className: "col-manager",
  },
  { key: "tags", label: "Thẻ", sortable: false, className: "col-tags" },
  {
    key: "stage_id",
    label: "Trạng thái",
    sortable: true,
    className: "col-status",
  },
  {
    key: "allocated_hours",
    label: "Thời gian phân bổ",
    sortable: true,
    className: "col-hours",
  },
  {
    key: "effective_hours",
    label: "Thời gian đã dùng",
    sortable: true,
    className: "col-hours",
  },
  {
    key: "remaining_hours",
    label: "Thời gian còn lại",
    sortable: true,
    className: "col-hours",
  },
];

function ProjectDashboard() {
  const [projects, setProjects] = useState([]);
  const [stages, setStages] = useState([]);
  const [users, setUsers] = useState([]);
  const { user, role } = useAuth();
  const [editProject, setEditProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  // THÊM MỚI: State để quản lý nhóm và trạng thái thu gọn
  const [groupedProjects, setGroupedProjects] = useState({});
  const [collapsedStages, setCollapsedStages] = useState({});

  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({ stage_id: "", user_id: "" });
  const [sortConfig, setSortConfig] = useState({
    key: "date_start",
    direction: "desc",
  });
  const [viewMode, setViewMode] = useState(
    localStorage.getItem("projectDashboardViewMode") || "list"
  );
  const [visibleColumns, setVisibleColumns] = useState(
    JSON.parse(localStorage.getItem("visibleColumns")) || [
      "display_name",
      "milestone_progress",
      "user_id",
      "tags",
      "stage_id",
    ]
  );

  useEffect(() => {
    localStorage.setItem("visibleColumns", JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  useEffect(() => {
    localStorage.setItem("projectDashboardViewMode", viewMode);
  }, [viewMode]);

  const loadInitialData = async () => {
    try {
      const [stageList, userList] = await Promise.all([
        fetchAllProjectStages(),
        fetchUsers(),
      ]);
      setStages(stageList);
      setUsers(userList);
    } catch (err) {
      setError("Không thể tải dữ liệu cho bộ lọc. Vui lòng thử lại sau.");
    }
  };

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const domain = [];
      if (searchTerm) {
        domain.push(["name", "ilike", searchTerm]);
      }
      if (filters.stage_id) {
        domain.push(["stage_id", "=", parseInt(filters.stage_id)]);
      }
      if (filters.user_id) {
        domain.push(["user_id", "=", parseInt(filters.user_id)]);
      }

      const order = `${sortConfig.key} ${sortConfig.direction}`;

      const data = await fetchProjectsWithDetail({ domain, order });
      setProjects(data);
    } catch (err) {
      setError("Không thể tải dữ liệu dự án. Vui lòng thử lại sau.");
      console.error("Failed to fetch projects:", err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filters, sortConfig]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // THÊM MỚI: useEffect để nhóm các project theo stage
  useEffect(() => {
    if (projects.length > 0 && stages.length > 0) {
      const groups = stages.reduce((acc, stage) => {
        acc[stage.id] = projects.filter(
          (p) => p.stage_id && p.stage_id[0] === stage.id
        );
        return acc;
      }, {});
      setGroupedProjects(groups);
    }
  }, [projects, stages]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
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

  // THÊM MỚI: Hàm để thu gọn/mở rộng nhóm
  const toggleStageCollapse = (stageId) => {
    setCollapsedStages((prev) => ({ ...prev, [stageId]: !prev[stageId] }));
  };

  const handleViewTasks = (projectId) => {
    navigate(`/projects/${projectId}`);
  };

  const handleInlineEditProject = async (editData) => {
    try {
      await updateProject(editData.id, {
        name: editData.display_name,
        stage_id: editData.stage_id?.[0] || false,
      });
      setProjects((prev) =>
        prev.map((p) => (p.id === editData.id ? { ...p, ...editData } : p))
      );
    } catch (err) {
      alert("Cập nhật dự án thất bại: " + err.message);
    }
  };

  const handleOpenCreateModal = () => {
    setEditProject(null);
    setShowModal(true);
  };

  const handleSaveProject = async (projectData) => {
    try {
      if (!editProject) {
        await createProject(projectData);
      }
      setShowModal(false);
      setEditProject(null);
      await loadProjects();
    } catch (err) {
      alert("Không thể lưu dự án: " + err.message);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa dự án này không?")) {
      await deleteProject(projectId);
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    }
  };

  const handleProjectStageChange = async (projectId, newStageId) => {
    // Cập nhật state gốc để đảm bảo dữ liệu nhất quán
    setProjects((prevProjects) =>
      prevProjects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              stage_id: [
                parseInt(newStageId),
                stages.find((s) => s.id === parseInt(newStageId))?.name || "",
              ],
            }
          : p
      )
    );

    // Gọi API để cập nhật backend
    try {
      await updateProject(projectId, { stage_id: parseInt(newStageId) });
    } catch (err) {
      alert("Lỗi: Không thể cập nhật trạng thái dự án. Đang tải lại...");
      loadProjects(); // Tải lại toàn bộ nếu có lỗi
    }
  };

  // Define canEditAll based on user role (adjust logic as needed)
  const canEditAll = role === ROLES.ADMIN || role === ROLES.MANAGER;

  if (error) {
    return (
      <Container className="py-4">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  const orderedVisibleColumns = ALL_COLUMNS.filter((c) =>
    visibleColumns.includes(c.key)
  );

  return (
    <Container fluid className="py-4">
      {/* ... Phần header, controls ... giữ nguyên ... */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1>Dashboard Quản lý hợp phần</h1>
        <div className="d-flex gap-2">
          <Button variant="primary" onClick={handleOpenCreateModal}>
            <i className="fa fa-plus me-2"></i> Tạo dự án mới
          </Button>
        </div>
      </div>
      <div className="p-3 mb-3 bg-light border rounded">
        <Row className="g-2">
          <Col md={6}>
            <InputGroup>
              <InputGroup.Text>
                <FaSearch />
              </InputGroup.Text>
              <FormControl
                placeholder="Tìm theo tên dự án..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
          </Col>
          <Col md={3}>
            <Form.Select
              name="stage_id"
              value={filters.stage_id}
              onChange={handleFilterChange}>
              <option value="">-- Lọc theo trạng thái --</option>
              {stages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Form.Select>
          </Col>
          <Col md={3}>
            <Form.Select
              name="user_id"
              value={filters.user_id}
              onChange={handleFilterChange}>
              <option value="">-- Lọc theo trưởng dự án --</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </Form.Select>
          </Col>
        </Row>
      </div>
      <div className="d-flex justify-content-end align-items-center mb-3">
        <ButtonGroup className="me-2">
          <Button
            variant={viewMode === "list" ? "primary" : "outline-secondary"}
            onClick={() => setViewMode("list")}>
            <FaList /> List
          </Button>
          <Button
            variant={viewMode === "kanban" ? "primary" : "outline-secondary"}
            onClick={() => setViewMode("kanban")}>
            <FaTh /> Kanban
          </Button>
        </ButtonGroup>
        <ColumnFilter
          columns={ALL_COLUMNS}
          visibleColumns={visibleColumns}
          onColumnToggle={handleColumnToggle}
        />
      </div>

      {loading ? (
        <div className="text-center">
          <Spinner animation="border" />
        </div>
      ) : (
        <>
          {viewMode === "list" ? (
            <div className="table-sticky-container">
              <table className="table table-bordered table-hover table-striped unified-table">
                <thead className="table-header">
                  <tr>
                    {orderedVisibleColumns.map((col) => (
                      <th
                        key={col.key}
                        className={col.className}
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
                    <th className="col-action">Hành động</th>
                  </tr>
                </thead>
                {/* THAY ĐỔI: Render bảng theo nhóm */}
                {stages.map(
                  (stage) =>
                    groupedProjects[stage.id]?.length > 0 && (
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
                            <span className="ms-2">{stage.name}</span>
                            <span className="badge bg-secondary rounded-pill ms-2">
                              {groupedProjects[stage.id].length}
                            </span>
                          </th>
                        </tr>
                        {!collapsedStages[stage.id] &&
                          groupedProjects[stage.id].map((project) => (
                            <ProjectListItem
                              key={project.id}
                              project={project}
                              canEditAll={canEditAll} // <-- TRUYỀN QUYỀN XUỐNG
                              orderedVisibleColumns={orderedVisibleColumns}
                              stages={stages}
                              onViewTasks={handleViewTasks}
                              onEditProject={handleInlineEditProject}
                              onDeleteProject={handleDeleteProject}
                            />
                          ))}
                      </tbody>
                    )
                )}
              </table>
            </div>
          ) : (
            <ProjectKanbanView
              projects={projects}
              stages={stages}
              onProjectStageChange={handleProjectStageChange}
            />
          )}
        </>
      )}

      <ProjectModal
        show={showModal}
        onHide={() => {
          setShowModal(false);
          setEditProject(null);
        }}
        onSave={handleSaveProject}
        project={editProject}
      />
    </Container>
  );
}

export default ProjectDashboard;
