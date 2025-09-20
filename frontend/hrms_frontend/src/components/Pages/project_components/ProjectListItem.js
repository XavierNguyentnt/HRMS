// src/components/Pages/project_components/ProjectListItem.js
import React, { useState } from "react";
import { Button, ButtonGroup, Form } from "react-bootstrap";
import StatusIndicator from "./StatusIndicator";
import ProjectTags from "./ProjectTags";
import ProgressBar from "./ProgressBar";

// Bỏ prop onOpenModalEdit
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

  // ... object 'cells' giữ nguyên ...
  const cells = {
    display_name: (
      <td key="display_name">
        {isEditing ? (
          <Form.Control
            size="sm"
            value={editData.display_name}
            onChange={(e) =>
              setEditData({ ...editData, display_name: e.target.value })
            }
          />
        ) : (
          <strong>{project.display_name || "-"}</strong>
        )}
      </td>
    ),
    stage_id: (
      <td key="stage_id">
        {isEditing ? (
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
            stage={{
              id: project.stage_id?.[0],
              name: project.stage_id?.[1],
            }}
          />
        )}
      </td>
    ),
    milestone_progress: (
      <td key="milestone_progress">
        <ProgressBar value={project.milestone_progress || 0} />
      </td>
    ),
    partner_id: <td key="partner_id">{project.partner_id?.[1] || "-"}</td>,
    company_id: <td key="company_id">{project.company_id?.[1] || "-"}</td>,
    user_id: <td key="user_id">{project.user_id?.[1] || "-"}</td>,
    tags: (
      <td key="tags">
        <ProjectTags tags={project.tags || []} />
      </td>
    ),
    planned_date: <td key="planned_date">{project.planned_date || "-"}</td>,
    allocated_hours: (
      <td key="allocated_hours">{project.allocated_hours || 0} giờ</td>
    ),
    effective_hours: (
      <td key="effective_hours">{project.effective_hours || 0} giờ</td>
    ),
    remaining_hours: (
      <td key="remaining_hours">{project.remaining_hours || 0} giờ</td>
    ),
  };

  return (
    <tr>
      {orderedVisibleColumns.map((col) => cells[col.key])}
      <td className="col-action">
        <ButtonGroup size="sm">
          {/* === THAY ĐỔI Ở ĐÂY === */}
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
