// src/components/Pages/project_components/StatusIndicator.js
import React from "react";
import { FaPlayCircle, FaCheckCircle } from "react-icons/fa";

/**
 * Hàm hash đơn giản để chuyển một chuỗi thành một số nguyên.
 * Giúp đảm bảo một tên giai đoạn luôn có cùng một màu.
 * @param {string} str - Chuỗi đầu vào (tên giai đoạn)
 * @returns {number} - Một số hash
 */
const simpleHash = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Chuyển thành số nguyên 32-bit
  }
  return hash;
};

/**
 * Hàm tiện ích để làm sạch tên giai đoạn, chỉ dùng cho mục đích hiển thị.
 */
const cleanStageName = (name) => {
  if (typeof name !== "string" || !name) return "";
  return name.replace(/^[\d\s._-]+/, "");
};

const StatusIndicator = ({ stage }) => {
  // `stage` object có thể có dạng { id, name, color, fold } (cho Dự án)
  // hoặc { id, name, fold } (cho Nhiệm vụ)
  if (!stage || !stage.name) {
    return <span>Không xác định</span>;
  }

  // 1. LOGIC XÁC ĐỊNH MÀU SẮC LINH HOẠT
  let colorIndex;
  if (stage.color !== undefined && stage.color !== false) {
    // ƯU TIÊN 1: Dùng `color` từ Odoo nếu có (dành cho Giai đoạn Dự án)
    colorIndex = stage.color;
  } else {
    // ƯU TIÊN 2: Tự tính toán màu từ tên (dành cho Giai đoạn Nhiệm vụ)
    // Đảm bảo "Đang tiến hành" luôn có 1 màu, "Hoàn thành" luôn có 1 màu khác.
    colorIndex = Math.abs(simpleHash(stage.name) % 12);
  }
  const colorClass = `stage-color-${colorIndex}`;

  // 2. TÊN HIỂN THỊ: Luôn được làm sạch.
  const displayName = cleanStageName(stage.name);

  // 3. ICON: Logic ổn định dựa trên trạng thái kỹ thuật `stage.fold`.
  const icon = stage.fold ? <FaCheckCircle /> : <FaPlayCircle />;

  return (
    <span className={`stage-badge ${colorClass}`}>
      {icon}
      <span>{displayName}</span>
    </span>
  );
};

export default StatusIndicator;
