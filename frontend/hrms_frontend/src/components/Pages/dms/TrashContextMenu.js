import React from "react";

const TrashContextMenu = ({ menuState, onAction }) => {
  if (!menuState.visible) return null;

  const { x, y } = menuState;

  return (
    <div
      className="context-menu bg-light border rounded shadow-sm position-fixed"
      style={{
        top: y,
        left: x,
        zIndex: 1050,
        minWidth: 180,
      }}>
      <ul className="list-unstyled mb-0">
        <li
          className="p-2 context-item text-success"
          onClick={() => onAction("restore")}
          style={{ cursor: "pointer" }}>
          🔄 Khôi phục
        </li>
        <li
          className="p-2 context-item text-danger"
          onClick={() => onAction("delete_permanent")}
          style={{ cursor: "pointer" }}>
          ❌ Xóa vĩnh viễn
        </li>
      </ul>
    </div>
  );
};

export default TrashContextMenu;
