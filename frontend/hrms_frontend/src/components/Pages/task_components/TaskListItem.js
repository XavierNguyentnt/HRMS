// src/components/Pages/task_components/TaskListItem.js
import React from "react";
import { Button, ButtonGroup } from "react-bootstrap";
import ProgressBar from "../project_components/ProgressBar";
import ProjectTags from "../project_components/ProjectTags";
import StatusIndicator from "../project_components/StatusIndicator";

const TaskListItem = ({ task, visibleColumns, tagsMap, onEdit, onDelete }) => {
  const renderCell = (colKey) => {
    switch (colKey) {
      // Các case đã có...
      case "name":
        return <strong>{task.name}</strong>;
      case "progress":
        return <ProgressBar value={task.progress || 0} />;
      case "tag_ids":
        const tags = (task.tag_ids || [])
          .map((id) => tagsMap.get(id))
          .filter(Boolean);
        return <ProjectTags tags={tags} />;

      // THÊM CÁC CASE CÒN THIẾU
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
    <tr>
      {visibleColumns.map((col) => (
        <td key={col.key}>{renderCell(col.key)}</td>
      ))}
      <td className="col-action">
        <ButtonGroup size="sm">
          <Button variant="warning" onClick={() => onEdit(task)}>
            Sửa
          </Button>
          <Button variant="danger" onClick={() => onDelete(task.id)}>
            Xóa
          </Button>
        </ButtonGroup>
      </td>
    </tr>
  );
};

export default React.memo(TaskListItem);
