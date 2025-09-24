// src/components/Pages/project_components/ProjectListItem.js
import React, { useState } from "react";
import { Button, ButtonGroup, Form } from "react-bootstrap";
import StatusIndicator from "./StatusIndicator";
import ProjectTags from "./ProjectTags";
import ProgressBar from "./ProgressBar";

const ProjectListItem = ({
  project,
  stages,
  onViewTasks,
  onEditProject,
  onDeleteProject,
  orderedVisibleColumns,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ ...project });

  const handleSave = () => {
    onEditProject(editData);
    setIsEditing(false);
  };

  // THAY ĐỔI LỚN: Helper function để render nội dung cho từng ô một cách linh hoạt
  const renderCellContent = (colKey) => {
    switch (colKey) {
      case "display_name":
        return isEditing ? (
          <Form.Control
            size="sm"
            value={editData.display_name}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) =>
              setEditData({ ...editData, display_name: e.target.value })
            }
          />
        ) : (
          <strong>{project.display_name || "-"}</strong>
        );

      case "stage_id":
        return isEditing ? (
          <Form.Select
            size="sm"
            value={editData.stage_id?.[0] || ""}
            onChange={(e) =>
              setEditData({
                ...editData,
                stage_id: [
                  parseInt(e.target.value),
                  stages.find((s) => s.id === parseInt(e.target.value))?.name ||
                    "",
                ],
              })
            }>
            <option value="">--Chọn--</option>
            {stages.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Form.Select>
        ) : (
          <StatusIndicator
            stage={{ id: project.stage_id?.[0], name: project.stage_id?.[1] }}
          />
        );

      case "milestone_progress":
        return <ProgressBar value={project.milestone_progress || 0} />;

      case "partner_id":
        return project.partner_id?.[1] || "-";

      case "company_id":
        return project.company_id?.[1] || "-";

      case "user_id":
        return project.user_id?.[1] || "-";

      case "tags":
        return <ProjectTags tags={project.tags || []} />;

      // SỬA LỖI: Dùng date_start, và lấy dữ liệu từ project.planned_date đã được tính toán sẵn
      case "date_start":
        return project.planned_date || "-";

      case "allocated_hours":
        return `${project.allocated_hours || 0} giờ`;

      case "effective_hours":
        return `${project.effective_hours || 0} giờ`;

      case "remaining_hours":
        return `${project.remaining_hours || 0} giờ`;

      default:
        return "-";
    }
  };

  return (
    <tr>
      {/* THAY ĐỔI LỚN: Lặp qua orderedVisibleColumns để tạo <td> một cách linh hoạt */}
      {orderedVisibleColumns.map((col) => (
        <td
          key={col.key}
          onClick={
            col.key === "display_name"
              ? () => onViewTasks(project.id)
              : undefined
          }
          style={{ cursor: col.key === "display_name" ? "pointer" : "default" }}
          title={
            col.key === "display_name" ? "Nhấp để xem chi tiết dự án" : ""
          }>
          {renderCellContent(col.key)}
        </td>
      ))}
      <td className="col-action">
        <ButtonGroup size="sm">
          <Button variant="info" onClick={() => onViewTasks(project.id)}>
            <i className="fa fa-tasks"></i> Chi tiết
          </Button>
          {isEditing ? (
            <>
              <Button variant="success" onClick={handleSave}>
                <i className="fa fa-check"></i> Lưu
              </Button>
              <Button variant="secondary" onClick={() => setIsEditing(false)}>
                <i className="fa fa-times"></i> Hủy
              </Button>
            </>
          ) : (
            <Button variant="warning" onClick={() => setIsEditing(true)}>
              <i className="fa fa-edit"></i> Sửa nhanh
            </Button>
          )}
          <Button variant="danger" onClick={() => onDeleteProject(project.id)}>
            <i className="fa fa-trash"></i> Xóa
          </Button>
        </ButtonGroup>
      </td>
    </tr>
  );
};

export default ProjectListItem;
