// src/components/Pages/project_components/TaskStatusbar.js
import React from "react";

const cleanStageName = (name) => {
  if (typeof name !== "string" || !name) return "";
  return name.replace(/^[\d\s._-]+/, "");
};

const TaskStatusbar = ({ allStages, currentStageId }) => {
  if (!allStages || allStages.length === 0) {
    return null;
  }

  const currentIndex = allStages.findIndex(
    (stage) => stage.id === currentStageId
  );

  return (
    <div className="task-statusbar-container mb-3">
      {allStages.map((stage, index) => {
        let statusClass = "";
        if (currentIndex === -1) {
          statusClass = "is-future";
        } else if (index < currentIndex) {
          statusClass = "is-completed";
        } else if (index === currentIndex) {
          statusClass = "is-current";
        } else {
          statusClass = "is-future";
        }

        return (
          <div key={stage.id} className={`statusbar-item ${statusClass}`}>
            {cleanStageName(stage.name)}
          </div>
        );
      })}
    </div>
  );
};

export default TaskStatusbar;
