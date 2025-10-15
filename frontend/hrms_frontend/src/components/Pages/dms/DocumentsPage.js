// src/components/Pages/DMS/DocumentsPage.js
import React, { useState } from "react";
import { Menu, Item, useContextMenu } from "react-contexify";
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

//Components
import DmsToolbar from "./DmsToolbar";
import DmsListView from "./DmsListView";
import DmsKanbanView from "./DmsKanbanView";
import DmsUploadModal from "./DmsUploadFileModal";
import DmsNewFileModal from "./DmsNewFileModal";
import DmsDirectoryPanel from "./DmsDirectoryPanel";
import DmsBreadcrumbs from "./DmsBreadcrumbs";
import DmsNewFolderModal from "./DmsNewFolderModal";
import CustomDragLayer from "./CustomDragLayer";

//APIs
import {
  moveItem,
  renameItem,
  deleteItem,
  createDirectory,
} from "../../../services/api/dmsAPI";
//Hooks
import { useDocuments } from "../../hooks/useDocuments";

const MENU_ID = "dms-menu";

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

  const { show } = useContextMenu({
    id: MENU_ID,
  });

  // HANDLE SINGLE CLICK
  const handleItemClick = (e, clickedItem) => {
    const { ctrlKey, metaKey } = e; // Check for Ctrl (Windows) or Cmd (Mac) key
    const isAlreadySelected = selectedItems.some(
      (item) => item.id === clickedItem.id && item.type === clickedItem.type
    );

    if (ctrlKey || metaKey) {
      // Với phím Ctrl/Cmd: Thêm hoặc bớt item khỏi danh sách đã chọn
      setSelectedItems((prev) =>
        isAlreadySelected
          ? prev.filter((item) => item.id !== clickedItem.id)
          : [...prev, clickedItem]
      );
    } else {
      // Click thông thường: Chọn duy nhất item này
      setSelectedItems([clickedItem]);
    }
  };

  // HANDLE DOUBLE CLICK
  const handleItemDoubleClick = (item) => {
    if (item.type === "directory") {
      // Dùng lại hàm handleSelectDirectory để điều hướng
      handleSelectDirectory(item, [...breadcrumbPath, item]);
    } else {
      // Mở file trong tab mới
      const baseUrl =
        process.env.REACT_APP_ODOO_BASE_URL || "http://localhost:8069";
      window.open(
        `${baseUrl}${item.access_url}`,
        "_blank",
        "noopener,noreferrer"
      );
    }
  };

  // Lấy selectedDir để truyền cho Modal
  const handleSelectDirectory = (dir, path) => {
    setFilters.setSelectedDir(dir); // Chỉ cần cập nhật state trong hook
    setBreadcrumbPath(path || []); // Cập nhật breadcrumb
  };

  // { action: 'cut'|'copy', item: {...} }
  function handleContextMenu(event, item) {
    if (item) {
      event.preventDefault();
      event.stopPropagation();

      // 👇 Bước 1: Hiển thị menu ngay lập tức
      show({ event, props: { item } });
      console.log("Right-clicked item:", item);
      console.log("Props gửi vào show:", { item });

      // 👇 Bước 2: Cập nhật state lựa chọn sau
      const isSelected = selectedItems.some((sel) => sel.id === item.id);
      if (!isSelected) {
        setSelectedItems([item]);
      }
    }
  }

  // Handle click blank area to clear selection
  const handleContainerClick = (e) => {
    // Chỉ bỏ chọn nếu click trực tiếp vào container, không phải vào item con
    if (
      e.target.classList.contains("documents-page") ||
      e.target.classList.contains("kanban-container-wrapper")
    ) {
      setSelectedItems([]);
    }
  };

  const handleItemAction = (actionId, currentItem) => {
    const baseUrl =
      process.env.REACT_APP_ODOO_BASE_URL || "http://localhost:8069";

    switch (actionId) {
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
      case "cut": {
        if (!currentItem) return;
        setClipboard({ action: "cut", item: currentItem });
        break;
      }
      case "paste": {
        if (clipboard) {
          const targetDirId =
            currentItem?.type === "directory"
              ? currentItem.id
              : filters.selectedDir?.id || false;
          const model =
            clipboard.item.type === "directory" ? "dms.directory" : "dms.file";

          moveItem(model, clipboard.item.id, targetDirId)
            .then(() => {
              refresh();
              setClipboard(null);
            })
            .catch(alert);
        }
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
    <DndProvider backend={HTML5Backend}>
      <div className="documents-page d-flex" onClick={handleContainerClick}>
        <div className="flex-grow-1 p-3">
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

          <DmsBreadcrumbs
            path={breadcrumbPath} // 👈 Truyền đường dẫn xuống
            onNavigate={handleSelectDirectory}
          />

          <DmsToolbar
            onSearch={setFilters.setSearchTerm}
            onSortChange={setFilters.setSortConfig}
            onViewChange={setViewMode}
            onDateFilter={setFilters.setDateRange}
            currentView={viewMode}
          />

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
            </div>
          ) : immediateItems.length === 0 && allItems.length === 0 ? ( // Chỉ hiển thị khi thật sự trống
            <div className="text-center text-muted py-5">
              Không có tài liệu nào.
            </div>
          ) : viewMode === "list" ? (
            <DmsListView
              documents={allItems}
              onNavigate={handleSelectDirectory}
              onContextMenu={handleContextMenu}
              // 👇 TRUYỀN PROPS MỚI
              selectedItems={selectedItems}
              onItemClick={handleItemClick}
              onItemDoubleClick={handleItemDoubleClick}
            />
          ) : (
            <div
              className="kanban-container-wrapper"
              onClick={handleContainerClick}>
              <DmsKanbanView
                immediateItems={immediateItems}
                allItems={allItems}
                onNavigate={handleSelectDirectory}
                onContextMenu={handleContextMenu}
                breadcrumbPath={breadcrumbPath}
                // 👇 TRUYỀN PROPS MỚI
                selectedItems={selectedItems}
                onItemClick={handleItemClick}
                onItemDoubleClick={handleItemDoubleClick}
                onMoveItem={handleMoveItems}
              />
            </div>
          )}

          <Menu id={MENU_ID}>
            {({ props }) => {
              const item = props?.item; // Lấy item một cách an toàn
              return (
                <>
                  <Item
                    disabled={!item}
                    onClick={() => handleItemAction("rename", item)}>
                    Đổi tên
                  </Item>
                  <Item
                    disabled={!item}
                    onClick={() => handleItemAction("cut", item)}>
                    Cắt
                  </Item>
                  <Item
                    disabled={!clipboard}
                    onClick={() => handleItemAction("paste", item)}>
                    Dán
                  </Item>
                  <Item
                    disabled={!item}
                    className="text-danger"
                    onClick={() => handleItemAction("delete", item)}>
                    Xóa
                  </Item>
                  <Item
                    disabled={!item || item.type !== "file"}
                    onClick={() => handleItemAction("download", item)}>
                    Tải xuống
                  </Item>
                </>
              );
            }}
          </Menu>

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
  );
};

export default DocumentsPage;
