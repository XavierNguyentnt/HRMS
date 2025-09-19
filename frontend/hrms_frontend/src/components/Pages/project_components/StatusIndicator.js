// src/components/Pages/project_components/StatusIndicator.js
import React from "react";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationCircle,
  FaClock,
  FaPlayCircle,
} from "react-icons/fa";

const stageMap = {
  "Chuẩn bị": {
    code: "todo",
    label: "Chuẩn bị",
    color: "#6c757d",
    icon: <FaClock color="#6c757d" />,
  },
  "Chờ duyệt": {
    code: "approving",
    label: "Chờ phê duyệt",
    color: "#ffc107",
    icon: <FaExclamationCircle color="#ffc107" />,
  },
  "Đang triển khai": {
    code: "in_progress",
    label: "Đang triển khai",
    color: "#0d6efd",
    icon: <FaPlayCircle color="#0d6efd" />,
  },
  "Hoàn tất": {
    code: "done",
    label: "Hoàn tất",
    color: "#28a745",
    icon: <FaCheckCircle color="#28a745" />,
  },
  "Đã huỷ": {
    code: "cancelled",
    label: "Đã huỷ",
    color: "#dc3545",
    icon: <FaTimesCircle color="#dc3545" />,
  },
};

const StatusIndicator = ({ stageName }) => {
  const stage = stageMap[stageName] || {
    label: stageName || "Không xác định",
    color: "#adb5bd",
    icon: null,
  };

  return (
    <div className="d-flex align-items-center gap-2">
      <span
        className="status-dot"
        style={{
          display: "inline-block",
          width: "12px",
          height: "12px",
          borderRadius: "50%",
          backgroundColor: stage.color,
        }}></span>
      {stage.icon}
      <span className="status-label">{stage.label}</span>
    </div>
  );
};

export default StatusIndicator;
