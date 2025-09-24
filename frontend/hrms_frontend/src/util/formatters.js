// src/utils/formatters.js

/**
 * Loại bỏ các chữ số và khoảng trắng ở đầu một chuỗi.
 * Ví dụ: "9Chuẩn bị" -> "Chuẩn bị", "13 Hộp thư đến" -> "Hộp thư đến"
 * @param {string} name - Tên giai đoạn cần làm sạch.
 * @returns {string} Tên giai đoạn đã được làm sạch.
 */
export const cleanStageName = (name) => {
  if (typeof name !== "string" || !name) {
    return "";
  }
  // Sử dụng biểu thức chính quy (regex) để xóa số và khoảng trắng ở đầu chuỗi
  return name.replace(/^\d+\s*/, "");
};
