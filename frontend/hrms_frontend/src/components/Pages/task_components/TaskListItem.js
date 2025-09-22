// src/components/Pages/task_components/TaskListItem.js
import React from "react";
import { Button } from "react-bootstrap";
import ProgressBar from "../project_components/ProgressBar";

const TaskListItem = ({ task, visibleColumns, onEdit, onDelete }) => {
  const renderCell = (colKey) => {
    switch (colKey) {
      case "id":
        return task.id;
      case "name":
        return <strong>{task.name}</strong>;
      case "milestone_id":
        return task.milestone_id ? task.milestone_id[1] : "-";
      case "partner_id":
        return task.partner_id ? task.partner_id[1] : "-";
      case "user_ids":
        return task.user_ids?.length > 0
          ? task.user_ids.map((u) => u[1]).join(", ")
          : "-";
      case "date_deadline":
        return task.date_deadline || "-";
      case "progress":
        return <ProgressBar value={task.progress || 0} />;
      // Thêm các trường khác nếu cần
      default:
        return task[colKey] || "-";
    }
  };

  return (
    <tr>
      {visibleColumns.map((col) => (
        <td key={col.key}>{renderCell(col.key)}</td>
      ))}
      <td>
        <Button
          variant="outline-primary"
          size="sm"
          className="me-2"
          onClick={() => onEdit(task)}>
          <i className="fa fa-edit"></i>
        </Button>
        <Button
          variant="outline-danger"
          size="sm"
          onClick={() => onDelete(task.id)}>
          <i className="fa fa-trash"></i>
        </Button>
      </td>
    </tr>
  );
};

export default TaskListItem;
