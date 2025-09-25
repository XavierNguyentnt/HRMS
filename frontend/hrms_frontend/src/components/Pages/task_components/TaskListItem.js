// src/components/Pages/task_components/TaskListItem.js
import React, { useState } from "react";
import { Button, ButtonGroup, Form } from "react-bootstrap";
import ProgressBar from "../project_components/ProgressBar";
import ProjectTags from "../project_components/ProjectTags";
import StatusIndicator from "../project_components/StatusIndicator";

const TaskListItem = ({
  task,
  canEditAll,
  visibleColumns,
  tagsMap,
  onNavigate, // <-- Đảm bảo prop này được nhận
  onDelete,
  onInlineEdit,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ ...task });

  const handleSave = (e) => {
    e.stopPropagation(); // Ngăn điều hướng khi bấm Lưu
    onInlineEdit(editData);
    setIsEditing(false);
  };

  const handleCancel = (e) => {
    e.stopPropagation(); // Ngăn điều hướng khi bấm Hủy
    setEditData({ ...task });
    setIsEditing(false);
  };

  const handleEditClick = (e) => {
    e.stopPropagation(); // Ngăn điều hướng khi bấm Sửa nhanh
    setIsEditing(true);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation(); // Ngăn điều hướng khi bấm Xóa
    onDelete(task.id);
  };

  const renderCell = (colKey) => {
    switch (colKey) {
      case "name":
        return isEditing && canEditAll ? (
          <Form.Control
            size="sm"
            value={editData.name}
            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <strong>{task.name}</strong>
        );
      // ... các case khác không đổi
      case "progress":
        return <ProgressBar value={task.progress || 0} />;
      case "tag_ids":
        const tags = (task.tag_ids || [])
          .map((id) => tagsMap.get(id))
          .filter(Boolean);
        return <ProjectTags tags={tags} />;
      case "stage_id":
        return (
          <StatusIndicator stage={task.stage_id} isFolded={task.is_closed} />
        );
      case "personal_stage_type_id":
        return <StatusIndicator stage={task.personal_stage_type_id} />;
      default:
        const fieldValue = task[colKey];
        if (Array.isArray(fieldValue) && fieldValue.length > 0) {
          return fieldValue[1] || "-";
        }
        return fieldValue || "-";
    }
  };

  return (
    // THAY ĐỔI: Thêm onClick vào cả dòng và style con trỏ
    <tr onClick={() => onNavigate(task.id)} style={{ cursor: "pointer" }}>
      {visibleColumns.map((col) => (
        <td key={col.key}>{renderCell(col.key)}</td>
      ))}
      {/* QUAN TRỌNG: Thêm e.stopPropagation() để không bị điều hướng khi click vào nút */}
      <td className="col-action" onClick={(e) => e.stopPropagation()}>
        <ButtonGroup size="sm">
          {isEditing ? (
            <>
              <Button variant="success" onClick={handleSave}>
                Lưu
              </Button>
              <Button variant="secondary" onClick={handleCancel}>
                Hủy
              </Button>
            </>
          ) : (
            <Button variant="warning" onClick={handleEditClick}>
              Sửa nhanh
            </Button>
          )}

          <Button variant="danger" onClick={handleDeleteClick}>
            Xóa
          </Button>

          {/* THAY ĐỔI: Nút "Chi tiết" giờ cũng sẽ điều hướng */}
          <Button variant="info" onClick={() => onNavigate(task.id)}>
            Chi tiết
          </Button>
        </ButtonGroup>
      </td>
    </tr>
  );
};

export default React.memo(TaskListItem);
