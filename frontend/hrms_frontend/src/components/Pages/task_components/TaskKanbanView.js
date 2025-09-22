// src/components/Pages/project_components/TaskKanbanView.js
import React, { useState, useEffect } from "react";
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";

import { updateTask } from "../../../services/odooAPI";
import KanbanColumn from "./TaskKanbanColumn"; // Ta sẽ tạo component này ngay sau đây

const KanbanView = ({ tasks, stages, onTaskUpdate }) => {
  const [taskData, setTaskData] = useState({});
  const [loading, setLoading] = useState(true);

  // Xử lý dữ liệu ban đầu để nhóm task vào các cột
  useEffect(() => {
    if (stages.length > 0 && tasks) {
      const initialColumns = stages.reduce((acc, stage) => {
        acc[stage.id] = tasks.filter(
          (task) => task.stage_id && task.stage_id[0] === stage.id
        );
        return acc;
      }, {});

      // Xử lý các task không có stage_id hoặc stage_id không hợp lệ
      const unassignedTasks = tasks.filter(
        (task) =>
          !task.stage_id || !stages.find((s) => s.id === task.stage_id[0])
      );
      if (stages[0] && unassignedTasks.length > 0) {
        initialColumns[stages[0].id].push(...unassignedTasks);
      }

      setTaskData(initialColumns);
      setLoading(false);
    }
  }, [tasks, stages]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id;
    const oldStageId = active.data.current.sortable.containerId;
    const newStageId = over.id;

    if (oldStageId !== newStageId) {
      // 1. Cập nhật giao diện ngay lập tức (Optimistic Update)
      setTaskData((prev) => {
        const newColumns = { ...prev };
        const taskToMove = newColumns[oldStageId].find((t) => t.id === taskId);
        if (taskToMove) {
          newColumns[oldStageId] = newColumns[oldStageId].filter(
            (t) => t.id !== taskId
          );
          newColumns[newStageId] = [taskToMove, ...newColumns[newStageId]];
        }
        return newColumns;
      });

      // 2. Gọi API để cập nhật backend
      try {
        await updateTask(taskId, { stage_id: parseInt(newStageId) });
        // Nếu thành công, gọi hàm onTaskUpdate để đảm bảo dữ liệu đồng bộ hoàn toàn
        if (onTaskUpdate) {
          onTaskUpdate();
        }
      } catch (err) {
        alert("Lỗi: Không thể cập nhật trạng thái nhiệm vụ. Đang tải lại...");
        // Nếu lỗi, gọi onTaskUpdate để rollback về trạng thái đúng từ server
        if (onTaskUpdate) {
          onTaskUpdate();
        }
      }
    }
  };

  if (loading) return <p>Đang tải bảng Kanban...</p>;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragEnd={handleDragEnd}>
      <div className="d-flex flex-nowrap overflow-auto py-3">
        {stages.map((stage) => (
          <KanbanColumn
            key={stage.id}
            id={stage.id}
            title={stage.name}
            tasks={taskData[stage.id] || []}
          />
        ))}
      </div>
    </DndContext>
  );
};

export default KanbanView;
