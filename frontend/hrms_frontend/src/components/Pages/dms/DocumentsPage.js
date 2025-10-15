import React, { useState, useEffect, useCallback } from "react";
import { Button, Spinner } from "react-bootstrap";
import {
  Upload,
  Plus,
  PanelRightClose,
  PanelRightOpen,
  FolderPlus,
} from "lucide-react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

// Components
import DmsToolbar from "./DmsToolbar";
import DmsListView from "./DmsListView";
import DmsKanbanView from "./DmsKanbanView";
import DmsUploadModal from "./DmsUploadFileModal";
import DmsNewFileModal from "./DmsNewFileModal";
import DmsDirectoryPanel from "./DmsDirectoryPanel";
import DmsBreadcrumbs from "./DmsBreadcrumbs";
import DmsNewFolderModal from "./DmsNewFolderModal";
import CustomDragLayer from "./CustomDragLayer";
import CustomContextMenu from "./CustomContextMenu";
import DmsMoveModal from "./DmsMoveModal";

// APIs
import {
  copyItem,
  moveItem,
  renameItem,
  deleteItem,
  createDirectory,
} from "../../../services/api/dmsAPI";

// Hooks
import { useDocuments } from "../../hooks/useDocuments";

const DocumentsPage = () => {
  const { immediateItems, allItems, loading, setFilters, refresh, filters } =
    useDocuments();

  const [viewMode, setViewMode] = useState("kanban");
  const [showUpload, setShowUpload] = useState(false);
  const [showNewFile, setShowNewFile] = useState(false);
  const [showDirectoryPanel, setShowDirectoryPanel] = useState(true);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [breadcrumbPath, setBreadcrumbPath] = useState([]);
  const [clipboard, setClipboard] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [menuState, setMenuState] = useState({
    visible: false,
    x: 0,
    y: 0,
    item: null,
  });
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [itemsToMove, setItemsToMove] = useState([]);
  // 🖱️ Handle chuột phải (hiển thị context menu)
  const handleContextMenu = (event, item) => {
    event.preventDefault();
    event.stopPropagation();

    // Lấy vị trí click và cập nhật state để hiển thị menu
    setMenuState({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      item: item,
    });

    if (item) {
      const isSelected = selectedItems.some((sel) => sel.id === item.id);
      if (!isSelected) setSelectedItems([item]);
    }
  };

  const closeMenu = useCallback(() => {
    setMenuState((prev) => ({ ...prev, visible: false }));
  }, []);

  useEffect(() => {
    // Thêm event listener để đóng menu khi click bất cứ đâu
    window.addEventListener("click", closeMenu);

    // Cleanup: gỡ bỏ listener khi component unmount
    return () => {
      window.removeEventListener("click", closeMenu);
    };
  }, [closeMenu]);

  // 🖱️ Click chọn item
  const handleItemClick = (e, clickedItem) => {
    const { ctrlKey, metaKey } = e;
    const isAlreadySelected = selectedItems.some(
      (item) => item.id === clickedItem.id && item.type === clickedItem.type
    );

    if (ctrlKey || metaKey) {
      setSelectedItems((prev) =>
        isAlreadySelected
          ? prev.filter((item) => item.id !== clickedItem.id)
          : [...prev, clickedItem]
      );
    } else {
      setSelectedItems([clickedItem]);
    }
  };

  // 🖱️ Double click mở thư mục hoặc file
  const handleItemDoubleClick = (item) => {
    if (item.type === "directory") {
      handleSelectDirectory(item, [...breadcrumbPath, item]);
    } else {
      const baseUrl =
        process.env.REACT_APP_ODOO_BASE_URL || "http://localhost:8069";
      window.open(
        `${baseUrl}${item.access_url}`,
        "_blank",
        "noopener,noreferrer"
      );
    }
  };

  // 🧭 Chọn thư mục
  const handleSelectDirectory = (dir, path) => {
    setFilters.setSelectedDir(dir);
    setBreadcrumbPath(path || []);
  };

  // 🖱️ Bỏ chọn khi click vùng trống
  const handleContainerClick = (e) => {
    if (
      e.target.classList.contains("documents-page") ||
      e.target.classList.contains("kanban-container-wrapper")
    ) {
      setSelectedItems([]);
    }
  };

  const handleConfirmMove = (destinationDirId) => {
    handleMoveItems(itemsToMove, destinationDirId);
    setShowMoveModal(false);
  };

  // ✏️ Hành động context menu
  const handleItemAction = (actionId, currentItem) => {
    const baseUrl =
      process.env.REACT_APP_ODOO_BASE_URL || "http://localhost:8069";

    switch (actionId) {
      case "new_folder": {
        setShowNewFolderModal(true);
        break;
      }

      case "move": {
        if (!currentItem) return;

        // Nếu item được click nằm trong danh sách đang chọn, di chuyển cả nhóm
        const isPartOfSelection = selectedItems.some(
          (sel) => sel.id === currentItem.id
        );
        const items =
          isPartOfSelection && selectedItems.length > 0
            ? selectedItems
            : [currentItem];

        setItemsToMove(items);
        setShowMoveModal(true);
        break;
      }

      case "copy": {
        if (!currentItem) return;
        setClipboard({ action: "copy", item: currentItem });
        break;
      }

      case "cut": {
        if (!currentItem) return;
        setClipboard({ action: "cut", item: currentItem });
        break;
      }
      case "paste": {
        if (!clipboard) return;

        const targetDirId =
          currentItem?.type === "directory"
            ? currentItem.id
            : filters.selectedDir?.id || false;

        const model =
          clipboard.item.type === "directory" ? "dms.directory" : "dms.file";

        // Kiểm tra hành động trong clipboard
        const pasteAction =
          clipboard.action === "copy"
            ? copyItem(model, clipboard.item.id, targetDirId)
            : moveItem(model, clipboard.item.id, targetDirId);

        pasteAction
          .then(() => {
            refresh();
            // Xóa clipboard chỉ khi hành động là 'cut'
            if (clipboard.action === "cut") {
              setClipboard(null);
            } else {
              // Giữ lại clipboard nếu là copy để có thể paste nhiều lần
            }
          })
          .catch(alert);
        break;
      }

      case "delete": {
        if (!currentItem) return;
        if (
          window.confirm(`Bạn có chắc muốn xóa "${currentItem.name}" không?`)
        ) {
          const model =
            currentItem.type === "directory" ? "dms.directory" : "dms.file";
          deleteItem(model, currentItem.id).then(refresh).catch(alert);
        }
        break;
      }
      case "rename": {
        if (!currentItem) return;
        const newName = window.prompt("Nhập tên mới:", currentItem.name);
        if (newName && newName.trim() && newName !== currentItem.name) {
          const model =
            currentItem.type === "directory" ? "dms.directory" : "dms.file";
          renameItem(model, currentItem.id, newName.trim())
            .then(refresh)
            .catch(alert);
        }
        break;
      }
      case "download": {
        if (currentItem?.type === "file" && currentItem.access_url) {
          window.open(
            `${baseUrl}${currentItem.access_url}`,
            "_blank",
            "noopener,noreferrer"
          );
        }
        break;
      }
      default:
        break;
    }
  };

  const handleCreateFolder = (name) => {
    createDirectory(name, filters.selectedDir?.id || false)
      .then(() => {
        setShowNewFolderModal(false);
        refresh();
      })
      .catch(alert);
  };

  // 📦 Kéo thả di chuyển file/thư mục
  const handleMoveItems = async (draggedItems, targetDirId) => {
    try {
      for (const item of draggedItems) {
        const model = item.type === "directory" ? "dms.directory" : "dms.file";
        await moveItem(model, item.id, targetDirId);
      }
      refresh();
    } catch (err) {
      alert("Không thể di chuyển một hoặc nhiều mục!");
      console.error(err);
    }
  };

  return (
    <>
      <DndProvider backend={HTML5Backend}>
        <div
          className="documents-page d-flex"
          onContextMenu={(e) => handleContextMenu(e, null)}
          onClick={handleContainerClick}>
          <div className="flex-grow-1 p-3">
            {/* === Toolbar Header === */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="fw-bold mb-0">📁 Quản lý tài liệu</h4>
              <div className="d-flex gap-2">
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => setShowNewFolderModal(true)}>
                  <FolderPlus size={16} className="me-1" /> Tạo thư mục
                </Button>
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => setShowNewFile(true)}>
                  <Plus size={16} className="me-1" /> Tạo file mới
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowUpload(true)}>
                  <Upload size={16} className="me-1" /> Tải lên
                </Button>
                <Button
                  variant="outline-secondary"
                  onClick={() => setShowDirectoryPanel(!showDirectoryPanel)}>
                  {showDirectoryPanel ? (
                    <PanelRightClose size={18} />
                  ) : (
                    <PanelRightOpen size={18} />
                  )}
                </Button>
              </div>
            </div>

            {/* === Breadcrumbs & Toolbar === */}
            <DmsBreadcrumbs
              path={breadcrumbPath}
              onNavigate={handleSelectDirectory}
            />

            <DmsToolbar
              onSearch={setFilters.setSearchTerm}
              onSortChange={setFilters.setSortConfig}
              onViewChange={setViewMode}
              onDateFilter={setFilters.setDateRange}
              currentView={viewMode}
            />

            {/* === Nội dung chính === */}
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" />
              </div>
            ) : immediateItems.length === 0 && allItems.length === 0 ? (
              <div className="text-center text-muted py-5">
                Không có tài liệu nào.
              </div>
            ) : viewMode === "list" ? (
              <DmsListView
                documents={allItems}
                onNavigate={handleSelectDirectory}
                onContextMenu={handleContextMenu}
                selectedItems={selectedItems}
                onItemClick={handleItemClick}
                onItemDoubleClick={handleItemDoubleClick}
              />
            ) : (
              <div
                className="kanban-container-wrapper"
                onContextMenu={(e) => handleContextMenu(e, null)} // Giữ nguyên để xử lý click vùng trống
                onClick={handleContainerClick}>
                <DmsKanbanView
                  immediateItems={immediateItems}
                  allItems={allItems}
                  // 👇 SỬA LẠI DÒNG NÀY
                  onContextMenu={handleContextMenu} // 👈 Sửa thành như thế này
                  breadcrumbPath={breadcrumbPath}
                  selectedItems={selectedItems}
                  onItemClick={handleItemClick}
                  onItemDoubleClick={handleItemDoubleClick}
                  onMoveItem={handleMoveItems}
                />
              </div>
            )}

            {/* === Modals === */}
            <DmsNewFileModal
              show={showNewFile}
              onHide={() => setShowNewFile(false)}
              onSuccess={refresh}
              selectedDirId={filters.selectedDir?.id}
            />
            <DmsUploadModal
              show={showUpload}
              onHide={() => setShowUpload(false)}
              onUploaded={refresh}
              selectedDirId={filters.selectedDir?.id}
            />
            <DmsNewFolderModal
              show={showNewFolderModal}
              onHide={() => setShowNewFolderModal(false)}
              onSubmit={handleCreateFolder}
            />
          </div>

          {showDirectoryPanel && (
            <DmsDirectoryPanel onSelectDirectory={handleSelectDirectory} />
          )}
          <CustomDragLayer />
        </div>
      </DndProvider>

      <DmsMoveModal
        show={showMoveModal}
        onHide={() => setShowMoveModal(false)}
        itemsToMove={itemsToMove}
        onConfirmMove={handleConfirmMove}
      />

      {/* === React-Contexify Menu === */}

      <CustomContextMenu
        menuState={menuState}
        onAction={handleItemAction}
        clipboard={clipboard}
      />
    </>
  );
};

export default DocumentsPage;
