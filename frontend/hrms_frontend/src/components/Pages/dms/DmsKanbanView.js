// src/components/Pages/DMS/DmsKanbanView.js

import React, { useState, useEffect } from "react";
import { Card } from "react-bootstrap";
import { Folder } from "lucide-react";
import { useDrag, useDrop } from "react-dnd";
import {
  broadcastDragStart,
  listenForDndMessages,
  broadcastDragEnd,
} from "../../../services/dndChannel";

const ItemTypes = { DMS_ITEM: "dms_item" };

// 🧩 Helper: tạo payload drag động
const makeDragItem = (itemData, selectedItems) => {
  if (!selectedItems || selectedItems.length === 0) return [itemData];
  const isPartOfSelection = selectedItems.some(
    (it) => it.id === itemData.id && it.type === itemData.type
  );
  return isPartOfSelection ? selectedItems : [itemData];
};

// 🗂️ DirectoryCard (Phiên bản nâng cấp)
const DirectoryCard = ({
  dir,
  onContextMenu,
  onItemClick,
  onItemDoubleClick,
  isSelected,
  onMoveItem,
  selectedItems,
  externalDragData,
}) => {
  const itemData = { ...dir, type: "directory" };
  const [isExternalDragOver, setIsExternalDragOver] = useState(false);

  // 👇 TẠO MỘT HÀM KIỂM TRA ĐIỀU KIỆN THẢ (Tái sử dụng logic từ react-dnd)
  const canDropItem = (draggedItems) => {
    if (!draggedItems || draggedItems.length === 0) return false;

    // Kiểm tra từng item đang được kéo
    return draggedItems.every((it) => {
      // Điều kiện 1: Không thể thả một thư mục vào chính nó.
      if (it.type === "directory" && it.id === dir.id) {
        return false;
      }

      // Điều kiện 2: Không thể thả một item vào thư mục mà nó đang chứa.
      let currentParentId;
      if (it.type === "directory") {
        // Nếu là thư mục, kiểm tra parent_id
        currentParentId = it.parent_id ? it.parent_id[0] : false;
      } else {
        // Nếu là file, kiểm tra directory_id
        currentParentId = it.directory_id ? it.directory_id[0] : false;
      }

      // So sánh ID thư mục cha hiện tại với ID của thư mục đích
      return currentParentId !== dir.id;
    });
  };
  // --- Logic kéo đi (react-dnd) ---
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.DMS_ITEM,
    item: () => {
      const dragItems = makeDragItem(itemData, selectedItems);
      broadcastDragStart(dragItems); // Gửi thông tin cho cửa sổ khác
      return { items: dragItems };
    },
    end: () => {
      broadcastDragEnd(); // Báo cho cửa sổ khác là đã kéo xong
    },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  // --- Logic thả vào (react-dnd, cho nội bộ) ---
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: ItemTypes.DMS_ITEM,
    drop: (dragData) => {
      const draggedItems = dragData.items || [];
      if (draggedItems.length > 0) onMoveItem(draggedItems, dir.id);
    },
    canDrop: (dragData) => canDropItem(dragData.items), // Dùng hàm helper
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  }));

  // --- Logic mới: Xử lý kéo-thả gốc từ cửa sổ khác ---
  const handleDragOver = (e) => {
    // Chỉ cho phép thả nếu có dữ liệu từ bên ngoài VÀ thỏa mãn điều kiện
    if (externalDragData && canDropItem(externalDragData)) {
      e.preventDefault();
      setIsExternalDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsExternalDragOver(false);
  };

  const handleDrop = (e) => {
    // Kiểm tra lại lần cuối trước khi thực hiện
    if (externalDragData && canDropItem(externalDragData)) {
      e.preventDefault();
      onMoveItem(externalDragData, dir.id);
      broadcastDragEnd();
      setIsExternalDragOver(false);
    }
  };

  const isDropTarget =
    (isOver && canDrop) ||
    (isExternalDragOver && canDropItem(externalDragData));

  return (
    <div
      ref={drag}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      // Gắn các event handler gốc của trình duyệt
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
          borderRadius: "12px",
          border: isSelected
            ? "2px solid var(--bs-primary)"
            : "2px solid transparent",
          transition: "background-color 0.2s ease, border-color 0.2s ease",
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

// 📄 FileCard (Cập nhật để gửi thông báo drag)
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
    item: () => {
      const dragItems = makeDragItem(itemData, selectedItems);
      broadcastDragStart(dragItems); // Gửi thông tin khi bắt đầu kéo file
      return { items: dragItems };
    },
    end: () => {
      broadcastDragEnd(); // Gửi thông báo khi kết thúc kéo file
    },
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
  // State để lưu dữ liệu kéo từ cửa sổ khác
  const [externalDragData, setExternalDragData] = useState(null);

  // Lắng nghe tin nhắn từ các cửa sổ khác
  useEffect(() => {
    const cleanup = listenForDndMessages((message) => {
      switch (message.type) {
        case "DRAG_START":
          setExternalDragData(message.payload.items);
          break;
        case "DRAG_END":
          setExternalDragData(null);
          break;
        default:
          break;
      }
    });
    return cleanup;
  }, []);

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
                  externalDragData={externalDragData} // Truyền dữ liệu xuống
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
