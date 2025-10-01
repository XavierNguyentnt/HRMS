// src/components/Pages/task_components/PriorityLevelBadge.js
import React from "react";

const PriorityLevelBadge = ({ priorityLevel }) => {
  const levels = {
    low: { label: "Thấp", bg: "secondary" },
    medium: { label: "Trung bình", bg: "info" },
    high: { label: "Cao", bg: "warning" },
  };

  const levelInfo = levels[priorityLevel];

  if (!levelInfo) {
    return null; // Không hiển thị gì nếu không có priority_level
  }

  return <span className={`badge bg-${levelInfo.bg}`}>{levelInfo.label}</span>;
};

export default PriorityLevelBadge;
