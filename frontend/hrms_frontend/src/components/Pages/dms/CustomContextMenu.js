// src/components/Pages/DMS/CustomContextMenu.js

import React, { useState } from "react";

// =================================================================
// 🧩 COMPONENT CON: MenuItem - Tái sử dụng cho mỗi mục trong menu
// =================================================================
const MenuItem = ({ children, onClick, disabled = false, danger = false }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Định nghĩa các kiểu style
  const baseStyle = {
    padding: "8px 16px",
    cursor: "pointer",
    userSelect: "none",
    whiteSpace: "nowrap",
    display: "block", // Sử dụng display block cho toàn bộ li
  };

  const disabledStyle = {
    color: "#aaa",
    cursor: "not-allowed",
  };

  const dangerStyle = {
    color: "#dc3545", // Màu đỏ cho hành động nguy hiểm
  };

  const hoverStyle = {
    backgroundColor: disabled ? "" : danger ? "#dc3545" : "#0073ea",
    color: disabled ? "" : "white",
  };

  // Kết hợp các style lại với nhau
  const finalStyle = {
    ...baseStyle,
    ...(disabled && disabledStyle),
    ...(danger && !isHovered && dangerStyle), // Chỉ áp dụng màu đỏ khi không hover
    ...(isHovered && hoverStyle),
  };

  const handleClick = () => {
    if (!disabled) {
      onClick();
    }
  };

  return (
    <li
      style={finalStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}>
      {children}
    </li>
  );
};

// =================================================================
// 🧩 COMPONENT CON: MenuSeparator - Dùng để tạo đường kẻ phân cách
// =================================================================
const MenuSeparator = () => (
  <hr
    style={{ margin: "4px 0", border: "none", borderTop: "1px solid #eee" }}
  />
);

// =================================================================
//  ዋና COMPONENT CHÍNH: CustomContextMenu
// =================================================================
const CustomContextMenu = ({ menuState, onAction, clipboard }) => {
  if (!menuState.visible) {
    return null;
  }

  const { item: currentItem, x, y } = menuState;

  // Định nghĩa style cho container của menu
  const menuContainerStyle = {
    position: "absolute",
    top: y,
    left: x,
    background: "white",
    border: "1px solid #ccc",
    borderRadius: "6px",
    boxShadow: "2px 2px 5px rgba(0,0,0,0.15)",
    padding: "6px 0",
    minWidth: "220px",
    zIndex: 10000,
  };

  return (
    <div style={menuContainerStyle}>
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {/* === Các hành động khi có item được chọn === */}
        {currentItem && (
          <>
            {currentItem.type === "file" && (
              <MenuItem onClick={() => onAction("details", currentItem)}>
                Xem chi tiết
              </MenuItem>
            )}
            <MenuItem onClick={() => onAction("rename", currentItem)}>
              Đổi tên...
            </MenuItem>

            <MenuSeparator />

            <MenuItem onClick={() => onAction("copy", currentItem)}>
              Sao chép
            </MenuItem>
            <MenuItem onClick={() => onAction("cut", currentItem)}>
              Cắt
            </MenuItem>
            <MenuItem onClick={() => onAction("move", currentItem)}>
              Di chuyển đến...
            </MenuItem>
          </>
        )}

        {/* === Các hành động chung === */}
        <MenuItem
          onClick={() => onAction("paste", currentItem)}
          disabled={!clipboard}>
          Dán
        </MenuItem>

        {/* === Các hành động khi không có item === */}
        {!currentItem && (
          <MenuItem onClick={() => onAction("new_folder", null)}>
            Tạo thư mục mới
          </MenuItem>
        )}

        {/* === Các hành động phá hủy (nguy hiểm) === */}
        {currentItem && (
          <>
            <MenuSeparator />
            {currentItem.type === "file" && (
              <MenuItem onClick={() => onAction("download", currentItem)}>
                Tải xuống
              </MenuItem>
            )}
            <MenuItem onClick={() => onAction("delete", currentItem)} danger>
              Xóa
            </MenuItem>
          </>
        )}
      </ul>
    </div>
  );
};

export default CustomContextMenu;
