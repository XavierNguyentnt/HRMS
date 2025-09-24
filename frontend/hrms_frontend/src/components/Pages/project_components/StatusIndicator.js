// src/components/Pages/project_components/StatusIndicator.js
import React from "react";
import { FaPlayCircle, FaCheckCircle } from "react-icons/fa";

const simpleHash = (str) => {
  let hash = 0;
  if (!str) return hash;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash;
};

const cleanStageName = (name) => {
  if (typeof name !== "string" || !name) return "";
  return name.replace(/^[\d\s._-]+/, "");
};

const StatusIndicator = ({ stage, isFolded = false }) => {
  // `stage` là một mảng [id, name] hoặc một object { id, name, color, fold }
  if (!stage) return <span>-</span>;

  // Chuẩn hóa dữ liệu đầu vào
  let name, color, fold;
  if (Array.isArray(stage)) {
    [, name] = stage;
    fold = isFolded; // Dùng isFolded từ prop nếu stage là array
  } else {
    ({ name, color, fold } = stage);
  }

  if (!name) return <span>-</span>;

  let colorIndex;
  if (color !== undefined && color !== false) {
    colorIndex = color;
  } else {
    colorIndex = Math.abs(simpleHash(name) % 12);
  }
  const colorClass = `stage-color-${colorIndex}`;
  const displayName = cleanStageName(name);
  const icon = fold ? <FaCheckCircle /> : <FaPlayCircle />;

  return (
    <span className={`stage-badge ${colorClass}`}>
      {icon}
      <span>{displayName}</span>
    </span>
  );
};

export default StatusIndicator;
