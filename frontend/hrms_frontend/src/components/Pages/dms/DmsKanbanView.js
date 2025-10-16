import React, { useState, useEffect } from "react";
import { Card } from "react-bootstrap";
import { Folder } from "lucide-react";
import { useDrag, useDrop } from "react-dnd";
import {
  broadcastDragStart,
  broadcastDragEnd,
  listenForDndMessages,
} from "../../../services/dndChannel";

const ItemTypes = { DMS_ITEM: "dms_item" };

const makeDragItem = (item, selectedItems) => {
  if (!selectedItems || selectedItems.length === 0) return [item];
  const isInGroup = selectedItems.some(
    (i) => i.id === item.id && i.type === item.type
  );
  return isInGroup ? selectedItems : [item];
};

const DirectoryCard = ({
  dir,
  onContextMenu,
  onItemClick,
  onItemDoubleClick,
  isSelected,
  selectedItems,
  onCopyItem,
  onMoveItem,
  externalDragData,
  isCtrlPressed,
}) => {
  const itemData = { ...dir, type: "directory" };
  const [isExternalDragOver, setIsExternalDragOver] = useState(false);
  // const [, setExternalDragData] = useState(null);
  // const [isCtrlPressed, setIsCtrlPressed] = useState(false);

  // useEffect(() => {
  //   const handleKeyDown = (e) => {
  //     if (e.key === "Control") setIsCtrlPressed(true);
  //   };
  //   const handleKeyUp = (e) => {
  //     if (e.key === "Control") setIsCtrlPressed(false);
  //   };

  //   window.addEventListener("keydown", handleKeyDown);
  //   window.addEventListener("keyup", handleKeyUp);

  //   return () => {
  //     window.removeEventListener("keydown", handleKeyDown);
  //     window.removeEventListener("keyup", handleKeyUp);
  //   };
  // }, []);

  const canDropItem = (draggedItems) => {
    if (!draggedItems?.length) return false;
    return draggedItems.every((it) => {
      if (it.type === "directory" && it.id === dir.id) return false;
      const parentId =
        it.type === "directory" ? it.parent_id?.[0] : it.directory_id?.[0];
      return parentId !== dir.id;
    });
  };

  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: ItemTypes.DMS_ITEM,
      item: () => {
        const dragItems = makeDragItem(itemData, selectedItems);
        const action = isCtrlPressed ? "copy" : "move";
        broadcastDragStart(dragItems, action);
        return { items: dragItems, action };
      },
      end: broadcastDragEnd,
      collect: (monitor) => ({ isDragging: !!monitor.isDragging() }),
    }),
    [selectedItems, isCtrlPressed]
  );

  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: ItemTypes.DMS_ITEM,
    drop: (data) => {
      const { items, action } = data;
      if (!items || items.length === 0) return;

      // Kiểm tra action từ payload và gọi hàm tương ứng
      if (action === "copy") {
        onCopyItem(items, dir.id);
      } else {
        onMoveItem(items, dir.id);
      }
    },
    canDrop: (data) => canDropItem(data.items),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  }));

  const handleDragOver = (e) => {
    if (externalDragData && canDropItem(externalDragData.items)) {
      e.preventDefault();
      setIsExternalDragOver(true);
    }
  };

  const handleDragLeave = () => setIsExternalDragOver(false);

  const handleDrop = (e) => {
    e.preventDefault();
    if (!externalDragData?.items?.length) return;
    if (!canDropItem(externalDragData.items)) return; // Thêm kiểm tra an toàn

    const { items, action } = externalDragData;
    if (action === "copy") {
      onCopyItem(items, dir.id);
    } else {
      onMoveItem(items, dir.id);
    }
  };

  const isDropTarget =
    (isOver && canDrop) ||
    (isExternalDragOver && canDropItem(externalDragData?.items));

  return (
    <div
      ref={drag}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onDragEnter={handleDragOver}>
      <Card
        ref={drop}
        className={`p-3 shadow-sm d-flex flex-column justify-content-center align-items-center ${
          isSelected ? "border-primary" : ""
        } ${isDropTarget ? "bg-light-success" : ""}`}
        style={{
          width: 220,
          height: 180,
          cursor: "pointer",
          borderRadius: 12,
          border: isSelected
            ? "2px solid var(--bs-primary)"
            : "2px solid transparent",
          transition: "0.2s ease",
        }}
        onClick={(e) => onItemClick(e, itemData)}
        onDoubleClick={() => onItemDoubleClick(itemData)}
        onContextMenu={(e) => {
          e.stopPropagation();
          onContextMenu(e, itemData);
        }}>
        <Folder size={60} strokeWidth={1} className="text-primary mb-2" />
        <div className="fw-semibold text-truncate text-center w-100">
          {dir.name}
        </div>
      </Card>
    </div>
  );
};

const FileCard = ({
  doc,
  onContextMenu,
  onItemClick,
  onItemDoubleClick,
  isSelected,
  selectedItems,
  isCtrlPressed,
  externalDragData,
}) => {
  const itemData = { ...doc, type: "file" };
  // const [isCtrlPressed, setIsCtrlPressed] = useState(false);

  // useEffect(() => {
  //   const handleKeyDown = (e) => {
  //     if (e.key === "Control") setIsCtrlPressed(true);
  //   };
  //   const handleKeyUp = (e) => {
  //     if (e.key === "Control") setIsCtrlPressed(false);
  //   };

  //   window.addEventListener("keydown", handleKeyDown);
  //   window.addEventListener("keyup", handleKeyUp);

  //   return () => {
  //     window.removeEventListener("keydown", handleKeyDown);
  //     window.removeEventListener("keyup", handleKeyUp);
  //   };
  // }, []);

  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: ItemTypes.DMS_ITEM,
      item: () => {
        const dragItems = makeDragItem(itemData, selectedItems);
        const action = isCtrlPressed ? "copy" : "move";
        // gửi qua BroadcastChannel với action
        broadcastDragStart(dragItems, action);
        // trả về payload để react-dnd trong cùng cửa sổ xử lý
        return { items: dragItems, action };
      },
      end: broadcastDragEnd,
      collect: (monitor) => ({ isDragging: !!monitor.isDragging() }),
    }),
    [selectedItems, isCtrlPressed]
  );

  const baseUrl =
    process.env.REACT_APP_ODOO_BASE_URL || "http://localhost:8069";

  return (
    <div ref={drag} style={{ opacity: isDragging ? 0.5 : 1 }}>
      <Card
        className={`p-3 shadow-sm ${isSelected ? "border-primary" : ""}`}
        style={{
          width: 220,
          height: 180,
          cursor: "pointer",
          borderRadius: 12,
          transition: "border-color 0.2s ease",
        }}
        onClick={(e) => onItemClick(e, itemData)}
        onDoubleClick={() => onItemDoubleClick(itemData)}
        onContextMenu={(e) => {
          e.stopPropagation();
          onContextMenu(e, itemData);
        }}>
        <img
          src={`${baseUrl}${doc.icon_url}`}
          alt="icon"
          style={{ height: 60, margin: "auto", objectFit: "contain" }}
        />
        <div className="mt-2 text-center">
          <div className="fw-semibold text-truncate">{doc.name}</div>
          <div className="text-muted small text-truncate">{doc.path_names}</div>
          <div className="text-muted small">{doc.human_size}</div>
        </div>
      </Card>
    </div>
  );
};

const DmsKanbanView = ({
  immediateItems,
  allItems,
  onContextMenu,
  breadcrumbPath,
  selectedItems,
  onItemClick,
  onItemDoubleClick,
  onMoveItem,
  onCopyItem,
  isCtrlPressed,
}) => {
  const [externalDragData, setExternalDragData] = useState(null);

  useEffect(() => {
    const cleanup = listenForDndMessages((msg) => {
      if (msg.type === "DRAG_START") setExternalDragData(msg.payload);
      else if (msg.type === "DRAG_END") setExternalDragData(null);
    });
    return cleanup;
  }, []);

  return (
    <div>
      <div className="mb-4">
        <h5 className="fw-bold text-muted mb-3">Thư mục và Tệp tin</h5>
        {immediateItems?.length > 0 ? (
          <div className="d-flex flex-wrap gap-3">
            {immediateItems.map((item) =>
              item.type === "directory" ? (
                <DirectoryCard
                  key={`dir-${item.id}`}
                  dir={item}
                  onContextMenu={onContextMenu}
                  onItemClick={onItemClick}
                  onItemDoubleClick={onItemDoubleClick}
                  isSelected={selectedItems.some(
                    (sel) => sel.id === item.id && sel.type === "directory"
                  )}
                  selectedItems={selectedItems}
                  onMoveItem={onMoveItem}
                  onCopyItem={onCopyItem}
                  externalDragData={externalDragData}
                  isCtrlPressed={isCtrlPressed}
                />
              ) : (
                <FileCard
                  key={`file-${item.id}`}
                  doc={item}
                  onContextMenu={onContextMenu}
                  onItemClick={onItemClick}
                  onItemDoubleClick={onItemDoubleClick}
                  isSelected={selectedItems.some(
                    (sel) => sel.id === item.id && sel.type === "file"
                  )}
                  selectedItems={selectedItems}
                  externalDragData={externalDragData}
                  isCtrlPressed={isCtrlPressed}
                />
              )
            )}
          </div>
        ) : (
          <p className="text-muted fst-italic">
            Không có thư mục hoặc tệp tin trực tiếp.
          </p>
        )}
      </div>

      <hr />

      <div className="mt-4">
        <h5 className="fw-bold text-muted mb-3">Tất cả Tệp tin</h5>
        {allItems?.length > 0 ? (
          <div className="d-flex flex-wrap gap-3">
            {allItems.map((file) => (
              <FileCard
                key={`file-${file.id}`}
                doc={file}
                onContextMenu={onContextMenu}
                onItemClick={onItemClick}
                onItemDoubleClick={onItemDoubleClick}
                isSelected={selectedItems.some(
                  (sel) => sel.id === file.id && sel.type === "file"
                )}
                selectedItems={selectedItems}
                externalDragData={externalDragData}
                isCtrlPressed={isCtrlPressed}
              />
            ))}
          </div>
        ) : (
          <p className="text-muted fst-italic">
            Không có tệp tin nào trong thư mục này.
          </p>
        )}
      </div>
    </div>
  );
};

export default DmsKanbanView;
