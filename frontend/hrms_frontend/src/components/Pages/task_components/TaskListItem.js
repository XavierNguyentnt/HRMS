// src/components/Pages/task_components/TaskListItem.js
import React from "react";
import { Button, ButtonGroup } from "react-bootstrap";
import ProgressBar from "../project_components/ProgressBar";

const formatDate = (dateString) => {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    // Lấy ngày, tháng, năm
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Tháng bắt đầu từ 0
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (error) {
    return dateString; // Trả về chuỗi gốc nếu có lỗi
  }
};

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
        return formatDate(task.date_deadline);
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
