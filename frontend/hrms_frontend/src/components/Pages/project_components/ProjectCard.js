// src/components/Pages/project_components/ProjectCard.js
import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import ProjectTags from "./ProjectTags";
import ProgressBar from "./ProgressBar";

const ProjectCard = ({ project }) => {
  const navigate = useNavigate();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: "grab",
  };

  const handleCardClick = () => {
    navigate(`/projects/${project.id}`);
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className="kanban-card mb-2" onClick={handleCardClick}>
        <Card.Body>
          <Card.Title className="h6">{project.display_name}</Card.Title>
          <div className="small text-muted mb-2">
            {project.partner_id ? project.partner_id[1] : "N/A"}
          </div>
          <div className="mb-2">
            <ProjectTags tags={project.tags || []} />
          </div>
          <div className="mb-2">
            <small>Tiến độ</small>
            <ProgressBar value={project.milestone_progress || 0} />
          </div>
          <div className="small mt-2 d-flex justify-content-between">
            <span>
              <strong>Quản lý:</strong>{" "}
              {project.user_id ? project.user_id[1] : "-"}
            </span>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default ProjectCard;
