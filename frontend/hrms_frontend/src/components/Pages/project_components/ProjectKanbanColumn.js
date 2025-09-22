// src/components/Pages/project_components/ProjectKanbanColumn.js
import React from "react";
import { SortableContext } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import ProjectCard from "./ProjectCard";

const ProjectKanbanColumn = ({ id, title, projects }) => {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div ref={setNodeRef} className="kanban-column">
      <h6 className="p-2 border-bottom d-flex justify-content-between">
        <span>{title}</span>
        <span className="badge bg-secondary rounded-pill">
          {projects.length}
        </span>
      </h6>
      <SortableContext id={id} items={projects.map((p) => p.id)}>
        <div className="kanban-column-content">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
};

export default ProjectKanbanColumn;
