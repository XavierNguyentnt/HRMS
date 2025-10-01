// src/components/Pages/task_components/PriorityIndicator.js
import React from "react";
import { FaStar } from "react-icons/fa";

// Component này nhận vào giá trị priority ('0' hoặc '1')
const PriorityIndicator = ({ priority }) => {
  const isHighPriority = priority === "1";

  if (!isHighPriority) {
    return null; // Không hiển thị gì nếu là ưu tiên thường
  }

  return (
    <span
      title="Ưu tiên cao"
      style={{
        color: "#FFC107",
        height: "2em",
        fontSize: "1.5rem",
        width: "1.5em",
      }}>
      <FaStar />
    </span>
  );
};

export default PriorityIndicator;
