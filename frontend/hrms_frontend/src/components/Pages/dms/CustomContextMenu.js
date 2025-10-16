// src/components/Pages/DMS/CustomContextMenu.js

import React, { useState, useRef, useLayoutEffect } from "react";

const MenuItem = ({ children, onClick, disabled = false, danger = false }) => {
  const [isHovered, setIsHovered] = useState(false);
  const baseStyle = {
    padding: "8px 16px",
    cursor: "pointer",
    userSelect: "none",
    whiteSpace: "nowrap",
    display: "block",
  };
  const disabledStyle = { color: "#aaa", cursor: "not-allowed" };
  const dangerStyle = { color: "#dc3545" };
  const hoverStyle = {
    backgroundColor: disabled ? "" : danger ? "#dc3545" : "#0073ea",
    color: disabled ? "" : "white",
  };
  const finalStyle = {
    ...baseStyle,
    ...(disabled && disabledStyle),
    ...(danger && !isHovered && dangerStyle),
    ...(isHovered && hoverStyle),
  };
  const handleClick = () => !disabled && onClick();
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

const MenuSeparator = () => (
  <hr
    style={{ margin: "4px 0", border: "none", borderTop: "1px solid #eee" }}
  />
);

// =================================================================
//  COMPONENT CHÍNH: CustomContextMenu (PHIÊN BẢN NÂNG CẤP)
// =================================================================
const CustomContextMenu = ({
  menuState,
  onAction,
  clipboard,
  selectedItemCount,
}) => {
  // Vô hiệu hóa "Đổi tên" nếu chọn nhiều hơn 1 mục
  const isRenameDisabled = selectedItemCount > 1;

  // Vô hiệu hóa "Dán" nếu clipboard rỗng
  const isPasteDisabled = !clipboard?.items?.length;
  const menuRef = useRef(null);
  const [position, setPosition] = useState({
    top: 0,
    left: 0,
    visibility: "hidden",
  });

  // 👇 SỬ DỤNG useLayoutEffect ĐỂ TÍNH TOÁN VỊ TRÍ
  useLayoutEffect(() => {
    if (menuState.visible && menuRef.current) {
      const { innerWidth: windowWidth, innerHeight: windowHeight } = window;
      const { offsetWidth: menuWidth, offsetHeight: menuHeight } =
        menuRef.current;

      let top = menuState.y;
      let left = menuState.x;

      // Nếu menu tràn ra dưới -> lật lên trên
      if (top + menuHeight > windowHeight) {
        top = menuState.y - menuHeight;
      }

      // Nếu menu tràn ra phải -> lật sang trái
      if (left + menuWidth > windowWidth) {
        left = menuState.x - menuWidth;
      }

      // Đảm bảo không bị lọt ra ngoài top/left
      if (top < 0) top = 5;
      if (left < 0) left = 5;

      setPosition({ top, left, visibility: "visible" });
    } else {
      // Ẩn menu khi không hiển thị để tính toán lại ở lần sau
      setPosition((prev) => ({ ...prev, visibility: "hidden" }));
    }
  }, [menuState]); // Chạy lại mỗi khi state của menu thay đổi

  if (!menuState.visible) {
    return null;
  }

  const { item: currentItem } = menuState;

  const menuContainerStyle = {
    position: "absolute",
    background: "white",
    border: "1px solid #ccc",
    borderRadius: "6px",
    boxShadow: "2px 2px 5px rgba(0,0,0,0.15)",
    padding: "6px 0",
    minWidth: "220px",
    zIndex: 10000,
    // 👇 Áp dụng vị trí đã tính toán và thuộc tính visibility
    top: `${position.top}px`,
    left: `${position.left}px`,
    visibility: position.visibility,
  };

  return (
    <div ref={menuRef} style={menuContainerStyle}>
      {/* Phần logic hiển thị các MenuItem giữ nguyên không thay đổi */}
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {currentItem && (
          <>
            {currentItem.type === "file" && (
              <MenuItem onClick={() => onAction("details", currentItem)}>
                Xem chi tiết
              </MenuItem>
            )}
            <MenuItem
              disabled={isRenameDisabled}
              onClick={() => onAction("rename", menuState.item)}>
              Đổi tên
            </MenuItem>
            <MenuSeparator />
            <MenuItem onClick={() => onAction("copy", currentItem)}>
              Sao chép
            </MenuItem>
            <MenuItem onClick={() => onAction("move", currentItem)}>
              Di chuyển đến...
            </MenuItem>
          </>
        )}
        <MenuItem
          disabled={isPasteDisabled}
          onClick={() => onAction("paste", menuState.item)}>
          Dán
        </MenuItem>
        {!currentItem && (
          <MenuItem onClick={() => onAction("new_folder", null)}>
            Tạo thư mục mới
          </MenuItem>
        )}
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
