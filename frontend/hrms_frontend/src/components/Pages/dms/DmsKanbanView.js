// src/components/Pages/DMS/DmsKanbanView.js
import React from "react";
import { Card } from "react-bootstrap";
import { Folder } from "lucide-react";
import { useDrag, useDrop } from "react-dnd";

const ItemTypes = { DMS_ITEM: "dms_item" };

// 🧩 Helper: tạo payload drag động
const makeDragItem = (itemData, selectedItems) => {
  if (!selectedItems || selectedItems.length === 0) return [itemData];
  // Nếu item hiện tại nằm trong selectedItems => kéo cả nhóm
  const isPartOfSelection = selectedItems.some(
    (it) => it.id === itemData.id && it.type === itemData.type
  );
  return isPartOfSelection ? selectedItems : [itemData];
};

// 🗂️ DirectoryCard
const DirectoryCard = ({
  dir,
  onContextMenu,
  onItemClick,
  onItemDoubleClick,
  isSelected,
  onMoveItem,
  selectedItems,
}) => {
  const itemData = { ...dir, type: "directory" };

  // Kéo đi
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.DMS_ITEM,
    item: () => ({ items: makeDragItem(itemData, selectedItems) }),
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  // Thả vào
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: ItemTypes.DMS_ITEM,
    drop: (dragData) => {
      const draggedItems = dragData.items || [];
      if (draggedItems.length > 0) onMoveItem(draggedItems, dir.id);
    },
    canDrop: (draggedItem) => {
      const draggedItems = draggedItem.items || [];
      return draggedItems.every(
        (it) => it.id !== dir.id && it.directory_id?.[0] !== dir.id
      );
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  }));

  return (
    <div ref={drag} style={{ opacity: isDragging ? 0.5 : 1 }}>
      <Card
        ref={drop}
        className={`p-3 shadow-sm d-flex flex-column justify-content-center align-items-center ${
          isSelected ? "border-primary" : ""
        } ${isOver && canDrop ? "bg-light-success" : ""} ${
          !isOver && canDrop ? "bg-light-info" : ""
        }`}
        style={{
          width: 220,
          height: 180,
          cursor: "pointer",
          borderRadius: "12px",
          border: isSelected
            ? "2px solid var(--bs-primary)"
            : "2px solid transparent",
          transition: "background-color 0.2s ease, border-color 0.2s ease",
        }}
        onClick={(e) => onItemClick(e, itemData)}
        onDoubleClick={() => onItemDoubleClick(itemData)}
        onContextMenu={(e) => onContextMenu(e, itemData)}>
        <Folder size={60} strokeWidth={1} className="text-primary mb-2" />
        <div className="fw-semibold text-truncate text-center w-100">
          {dir.name}
        </div>
      </Card>
    </div>
  );
};

// 📄 FileCard
const FileCard = ({
  doc,
  onContextMenu,
  onItemClick,
  onItemDoubleClick,
  isSelected,
  selectedItems,
}) => {
  const itemData = { ...doc, type: "file" };

  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.DMS_ITEM,
    item: () => ({ items: makeDragItem(itemData, selectedItems) }),
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

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
          borderRadius: "12px",
          border: isSelected
            ? "2px solid var(--bs-primary)"
            : "2px solid transparent",
          transition: "border-color 0.2s ease",
        }}
        onClick={(e) => onItemClick(e, itemData)}
        onDoubleClick={() => onItemDoubleClick(itemData)}
        onContextMenu={(e) => onContextMenu(e, itemData)}>
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

// 📦 View chính
const DmsKanbanView = ({
  immediateItems,
  allItems,
  onContextMenu,
  breadcrumbPath,
  selectedItems,
  onItemClick,
  onItemDoubleClick,
  onMoveItem,
}) => {
  return (
    <div>
      {/* ===== THƯ MỤC & FILE TRỰC TIẾP ===== */}
      <div className="mb-4">
        <h5 className="fw-bold text-muted mb-3">Thư mục và Tệp tin</h5>
        {immediateItems?.length > 0 ? (
          <div className="d-flex flex-wrap gap-3">
            {immediateItems.map((item) => {
              const isSelected = selectedItems.some(
                (sel) => sel.id === item.id && sel.type === item.type
              );
              return item.type === "directory" ? (
                <DirectoryCard
                  key={`dir-${item.id}`}
                  dir={item}
                  onContextMenu={onContextMenu}
                  onItemClick={onItemClick}
                  onItemDoubleClick={onItemDoubleClick}
                  isSelected={isSelected}
                  onMoveItem={onMoveItem}
                  selectedItems={selectedItems}
                />
              ) : (
                <FileCard
                  key={`file-${item.id}`}
                  doc={item}
                  onContextMenu={onContextMenu}
                  onItemClick={onItemClick}
                  onItemDoubleClick={onItemDoubleClick}
                  isSelected={isSelected}
                  selectedItems={selectedItems}
                />
              );
            })}
          </div>
        ) : (
          <p className="text-muted fst-italic">
            Không có thư mục con hoặc tệp tin trực tiếp.
          </p>
        )}
      </div>

      <hr />

      {/* ===== TẤT CẢ FILE ===== */}
      <div className="mt-4">
        <h5 className="fw-bold text-muted mb-3">Tất cả Tệp tin</h5>
        {allItems?.length > 0 ? (
          <div className="d-flex flex-wrap gap-3">
            {allItems.map((item) => {
              const isSelected = selectedItems.some(
                (sel) => sel.id === item.id && sel.type === "file"
              );
              return (
                <FileCard
                  key={`all-file-${item.id}`}
                  doc={item}
                  onContextMenu={onContextMenu}
                  onItemClick={onItemClick}
                  onItemDoubleClick={onItemDoubleClick}
                  isSelected={isSelected}
                  selectedItems={selectedItems}
                />
              );
            })}
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
