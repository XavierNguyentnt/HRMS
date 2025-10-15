import React from "react";
import { useDragLayer } from "react-dnd";

const layerStyles = {
  position: "fixed",
  pointerEvents: "none",
  zIndex: 2000,
  left: 0,
  top: 0,
  transform: "translate(0, 0)",
};

function getItemStyles(currentOffset) {
  if (!currentOffset) return { display: "none" };
  const { x, y } = currentOffset;
  const transform = `translate(${x}px, ${y}px)`;
  return {
    transform,
    WebkitTransform: transform,
  };
}

export default function CustomDragLayer() {
  const { item, isDragging, currentOffset } = useDragLayer((monitor) => ({
    item: monitor.getItem(),
    isDragging: monitor.isDragging(),
    currentOffset: monitor.getSourceClientOffset(),
  }));

  if (!isDragging || !item || !item.items) return null;

  return (
    <div style={layerStyles}>
      <div
        style={{
          ...getItemStyles(currentOffset),
          background: "rgba(0,0,0,0.8)",
          color: "#fff",
          padding: "6px 12px",
          borderRadius: "6px",
          fontSize: "14px",
          fontWeight: "500",
          transform: "translate(-50%, -100%)",
        }}>
        📦 Đang kéo {item.items.length} mục
      </div>
    </div>
  );
}
