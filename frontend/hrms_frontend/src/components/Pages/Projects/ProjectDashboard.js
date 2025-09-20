// src/components/Pages/Projects/ProjectDashboard.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Button, Spinner, Alert } from "react-bootstrap";
import {
  fetchProjectsWithDetail,
  fetchAllProjectStages,
  createProject,
  updateProject,
  deleteProject,
} from "../../../services/odooAPI";
import ProjectListItem from "../project_components/ProjectListItem";
import ProjectModal from "../project_components/ProjectModal";
import ColumnFilter from "../project_components/ColumnFilter";

const ALL_COLUMNS = [
  { key: "display_name", label: "Tên" },
  { key: "partner_id", label: "Khách hàng" },
  { key: "company_id", label: "Công ty" },
  { key: "planned_date", label: "Ngày theo kế hoạch" },
  { key: "milestone_progress", label: "Tiến độ Milestones" },
  { key: "user_id", label: "Trưởng dự án" },
  { key: "tags", label: "Thẻ" },
  { key: "stage_id", label: "Trạng thái" },
  { key: "allocated_hours", label: "Thời gian phân bổ" },
  { key: "effective_hours", label: "Thời gian đã dùng" },
  { key: "remaining_hours", label: "Thời gian còn lại" },
];

function ProjectDashboard() {
  const [projects, setProjects] = useState([]);
  const [stages, setStages] = useState([]);
  const [editProject, setEditProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const [visibleColumns, setVisibleColumns] = useState([
    "display_name",
    "partner_id",
    "milestone_progress",
    "user_id",
    "tags",
    "stage_id",
  ]);

  // Load danh sách dự án + stages
  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await fetchProjectsWithDetail();
      setProjects(data);
      const stageList = await fetchAllProjectStages();
      setStages(stageList);
    } catch (err) {
      setError("Không thể tải dữ liệu dự án. Vui lòng thử lại sau.");
      console.error("Failed to fetch projects:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleColumnToggle = (columnKey) => {
    setVisibleColumns((prev) =>
      prev.includes(columnKey)
        ? prev.filter((key) => key !== columnKey)
        : [...prev, columnKey]
    );
  };

  // 👉 Điều hướng tới trang chi tiết dự án
  const handleViewTasks = (projectId) => {
    navigate(`/projects/${projectId}`);
  };

  // 👉 Inline edit: sửa nhanh trực tiếp
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

  // 👉 Mở modal Tạo mới Dự án
  const handleOpenCreateModal = () => {
    setEditProject(null); // Đảm bảo không có dữ liệu cũ
    setShowModal(true);
  };

  // 👉 Lưu từ Modal (tạo mới hoặc sửa)
  const handleSaveProject = async (projectData) => {
    try {
      // Logic này chỉ xử lý TẠO MỚI từ Dashboard
      if (!editProject) {
        await createProject(projectData);
      }
      // Việc update sẽ do trang ProjectDetailPage xử lý
      setShowModal(false);
      setEditProject(null);
      await loadProjects(); // Tải lại danh sách
    } catch (err) {
      alert("Không thể lưu dự án: " + err.message);
    }
  };

  // 👉 Xóa dự án
  const handleDeleteProject = async (projectId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa dự án này không?")) {
      await deleteProject(projectId); // API: unlink
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    }
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

  const orderedVisibleColumns = ALL_COLUMNS.filter((c) =>
    visibleColumns.includes(c.key)
  );

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1>Dashboard Quản lý hợp phần</h1>
        <div className="d-flex gap-2">
          <Button variant="primary" onClick={handleOpenCreateModal}>
            <i className="fa fa-plus me-2"></i> Tạo dự án mới
          </Button>
          <ColumnFilter
            columns={ALL_COLUMNS}
            visibleColumns={visibleColumns}
            onColumnToggle={handleColumnToggle}
          />
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-bordered table-hover table-striped project-table">
          <thead className="table-header">
            <tr>
              {orderedVisibleColumns.map((col) => (
                <th
                  key={col.key}
                  className={`col-${col.key.replace("_", "-")}`}>
                  {col.label}
                </th>
              ))}
              <th className="col-action">Hành động</th>
            </tr>
          </thead>
          <tbody className="table-body">
            {projects.length > 0 ? (
              projects.map((project) => (
                <ProjectListItem
                  key={project.id}
                  project={project}
                  orderedVisibleColumns={orderedVisibleColumns}
                  stages={stages}
                  onViewTasks={handleViewTasks}
                  onEditProject={handleInlineEditProject} // sửa nhanh
                  onDeleteProject={handleDeleteProject}
                />
              ))
            ) : (
              <tr>
                <td
                  colSpan={orderedVisibleColumns.length + 1}
                  className="text-center">
                  Không có dự án nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal thêm/sửa */}
      <ProjectModal
        show={showModal}
        onHide={() => {
          setShowModal(false);
          setEditProject(null); // Reset khi đóng
        }}
        onSave={handleSaveProject}
        project={editProject} // Khi tạo mới, prop này sẽ là null
      />
    </Container>
  );
}

export default ProjectDashboard;
