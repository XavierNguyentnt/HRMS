// src/components/Pages/project_components/StatusIndicator.js
import React from "react";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationCircle,
  FaClock,
  FaPlayCircle,
} from "react-icons/fa";

// Map icon theo code chung, không gắn chặt màu
// const stageIconMap = {
//   todo: <FaClock />,
//   approving: <FaExclamationCircle />,
//   in_progress: <FaPlayCircle />,
//   done: <FaCheckCircle />,
//   cancelled: <FaTimesCircle />,
// };

const StatusIndicator = ({ stage }) => {
  if (!stage) {
    return <span>Không xác định</span>;
  }

  // stage = { id, name, color }
  const colorIndex = stage.id ? stage.id % 12 : 0;
  const colorClass = `stage-color-${colorIndex}`;

  // Icon (tuỳ chọn) – bạn có thể map theo id hoặc code nếu cần
  const stageIconMap = {
    1: <FaClock />, // Chuẩn bị
    2: <FaExclamationCircle />, // Chờ phê duyệt
    3: <FaPlayCircle />, // Đang triển khai
    4: <FaCheckCircle />, // Hoàn tất
    5: <FaTimesCircle />, // Đã hủy
  };
  const icon = stageIconMap[stage.id] || null;

  return (
    <span
      className={`stage-badge ${colorClass} d-inline-flex align-items-center gap-1`}>
      {icon && React.cloneElement(icon, { className: "me-1" })}
      {stage.name}
    </span>
  );
};

export default StatusIndicator;
