// src/components/Pages/project_components/ProjectKanbanView.js
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
import ProjectKanbanColumn from "./ProjectKanbanColumn";

const ProjectKanbanView = ({ projects, stages, onProjectStageChange }) => {
  const [projectData, setProjectData] = useState({});

  useEffect(() => {
    if (stages.length > 0 && projects) {
      const groupedProjects = stages.reduce((acc, stage) => {
        acc[stage.id] = projects.filter(
          (p) => p.stage_id && p.stage_id[0] === stage.id
        );
        return acc;
      }, {});

      // Xử lý các project không có stage_id hoặc stage_id không hợp lệ
      const unassignedProjects = projects.filter(
        (p) => !p.stage_id || !stages.find((s) => s.id === p.stage_id[0])
      );
      if (stages[0] && unassignedProjects.length > 0) {
        groupedProjects[stages[0].id].push(...unassignedProjects);
      }
      setProjectData(groupedProjects);
    }
  }, [projects, stages]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    const projectId = active.id;
    const oldStageId = active.data.current.sortable.containerId;
    const newStageId = over.id;

    if (oldStageId !== newStageId) {
      // Cập nhật UI ngay lập tức
      setProjectData((prev) => {
        const newColumns = { ...prev };
        const projectToMove = newColumns[oldStageId].find(
          (p) => p.id === projectId
        );
        if (projectToMove) {
          newColumns[oldStageId] = newColumns[oldStageId].filter(
            (p) => p.id !== projectId
          );
          newColumns[newStageId] = [projectToMove, ...newColumns[newStageId]];
        }
        return newColumns;
      });

      // Gọi hàm callback để cập nhật backend
      onProjectStageChange(projectId, newStageId);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragEnd={handleDragEnd}>
      <div className="d-flex flex-nowrap overflow-auto py-3">
        {stages.map((stage) => (
          <ProjectKanbanColumn
            key={stage.id}
            id={stage.id}
            title={stage.name}
            projects={projectData[stage.id] || []}
          />
        ))}
      </div>
    </DndContext>
  );
};

export default ProjectKanbanView;
