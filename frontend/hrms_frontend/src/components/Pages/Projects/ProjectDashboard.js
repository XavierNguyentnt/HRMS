// src/components/Pages/Projects/ProjectDashboard.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Spinner, Alert } from "react-bootstrap";
import { fetchProjectsWithDetail } from "../../../services/odooAPI";
import ProjectListItem from "../project_components/ProjectListItem";
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [visibleColumns, setVisibleColumns] = useState([
    "display_name",
    "partner_id",
    "milestone_progress",
    "user_id",
    "tags",
    "stage_id",
  ]); // Các cột mặc định

  const handleColumnToggle = (columnKey) => {
    setVisibleColumns((prev) =>
      prev.includes(columnKey)
        ? prev.filter((key) => key !== columnKey)
        : [...prev, columnKey]
    );
  };

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true);
        const data = await fetchProjectsWithDetail();
        setProjects(data);
      } catch (err) {
        setError("Không thể tải dữ liệu dự án. Vui lòng thử lại sau.");
        console.error("Failed to fetch projects:", err);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []); // Chỉ chạy 1 lần khi component được mount

  // Hàm điều hướng đến trang chi tiết
  const handleViewTasks = (projectId) => {
    navigate(`/projects/${projectId}`);
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
  // 1. Tạo một danh sách các cột sẽ hiển thị, theo đúng thứ tự của ALL_COLUMNS
  const orderedVisibleColumns = ALL_COLUMNS.filter((c) =>
    visibleColumns.includes(c.key)
  );

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1>Dự án</h1>
        <ColumnFilter
          columns={ALL_COLUMNS}
          visibleColumns={visibleColumns}
          onColumnToggle={handleColumnToggle}
        />
      </div>
      <div className="table-responsive">
        <table className="table table-bordered table-hover table-striped project-table">
          <thead className="table-header">
            <tr>
              {/* Render tiêu đề từ danh sách đã sắp xếp */}
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
                  onViewTasks={handleViewTasks}
                  // 2. Truyền danh sách đã sắp xếp xuống component con
                  orderedVisibleColumns={orderedVisibleColumns}
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
    </Container>
  );
}

export default ProjectDashboard;
