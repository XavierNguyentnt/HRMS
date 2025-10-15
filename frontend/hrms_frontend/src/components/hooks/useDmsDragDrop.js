// src/hooks/useDmsDragDrop.js
import { useDrag, useDrop } from "react-dnd";
import { ItemTypes } from "../utils/dmsItemTypes";

export const useDmsDrag = (item, onDragEnd) => {
  return useDrag(() => ({
    type: ItemTypes.DMS_ITEM,
    item,
    end: (draggedItem, monitor) => {
      if (monitor.didDrop()) {
        const dropResult = monitor.getDropResult();
        if (dropResult && onDragEnd) {
          onDragEnd(draggedItem, dropResult);
        }
      }
    },
  }));
};

export const useDmsDrop = (dirItem, onDrop) => {
  return useDrop(() => ({
    accept: ItemTypes.DMS_ITEM,
    drop: (draggedItem) => {
      if (onDrop) onDrop(draggedItem, dirItem);
      return { target: dirItem };
    },
    canDrop: (draggedItem) =>
      draggedItem.id !== dirItem.id && dirItem.type === "directory",
  }));
};
