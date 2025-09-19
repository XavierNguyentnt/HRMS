// src/components/Pages/project_components/ProjectListItem.js
import React from "react";
import StatusIndicator from "./StatusIndicator";
import ProjectTags from "./ProjectTags";
import ProgressBar from "./ProgressBar";

const ProjectListItem = ({ project, onViewTasks, orderedVisibleColumns }) => {
  // Các cell được định nghĩa theo key
  const cells = {
    display_name: (
      <td className="col-name" key="display_name">
        <strong>{project.display_name || "-"}</strong>
      </td>
    ),
    partner_id: (
      <td className="col-customer" key="partner_id">
        {project.partner_id?.[1] || "-"}
      </td>
    ),
    company_id: (
      <td className="col-company" key="company_id">
        {project.company_id?.[1] || "-"}
      </td>
    ),
    planned_date: (
      <td className="col-date" key="planned_date">
        {project.planned_date || "-"}
      </td>
    ),
    milestone_progress: (
      <td className="col-progress" key="milestone_progress">
        <ProgressBar value={project.milestone_progress || 0} />
      </td>
    ),
    user_id: (
      <td className="col-manager" key="user_id">
        {project.user_id?.[1] || "-"}
      </td>
    ),
    tags: (
      <td className="col-tags" key="tags">
        <ProjectTags tags={project.tags || []} />
      </td>
    ),
    stage_id: (
      <td className="col-status" key="stage_id">
        <StatusIndicator
          stageName={project.stage_id?.[1] || "Không xác định"}
        />
      </td>
    ),
    allocated_hours: (
      <td className="col-hours" key="allocated_hours">
        {project.allocated_hours || 0} giờ
      </td>
    ),
    effective_hours: (
      <td className="col-hours" key="effective_hours">
        {project.effective_hours || 0} giờ
      </td>
    ),
    remaining_hours: (
      <td className="col-hours" key="remaining_hours">
        {project.remaining_hours || 0} giờ
      </td>
    ),
  };

  return (
    <tr>
      {orderedVisibleColumns.map((col) =>
        React.cloneElement(cells[col.key], { key: col.key })
      )}
      <td className="col-action">
        <button
          className="btn btn-link p-0"
          onClick={() => onViewTasks(project.id)}>
          Xem nhiệm vụ
        </button>
      </td>
    </tr>
  );
};

export default ProjectListItem;
