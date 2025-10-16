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
import {
  broadcastRefresh,
  listenForDndMessages,
} from "../../../services/dndChannel";

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

import {
  copyItem,
  moveItem,
  renameItem,
  deleteItem,
  createDirectory,
  checkExistingFiles,
} from "../../../services/api/dmsAPI";

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
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);

  // lắng nghe Ctrl global (để truyền xuống File/Directory cards)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Control") setIsCtrlPressed(true);
    };
    const handleKeyUp = (e) => {
      if (e.key === "Control") setIsCtrlPressed(false);
    };

    const handleBlur = () => {
      setIsCtrlPressed(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  // Lắng nghe thông điệp từ BroadcastChannel (REFRESH)
  useEffect(() => {
    const cleanup = listenForDndMessages((msg) => {
      if (msg?.type === "REFRESH") {
        refresh();
      }
    });
    return cleanup;
  }, [refresh]);

  // ✅ Cho phép drop native giữa cửa sổ
  useEffect(() => {
    const handleDragOver = (e) => e.preventDefault();
    const handleDrop = (e) => e.preventDefault();
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", handleDrop);
    return () => {
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", handleDrop);
    };
  }, []);

  // ✅ Context menu
  const handleContextMenu = (event, item) => {
    event.preventDefault();
    event.stopPropagation();
    setMenuState({ visible: true, x: event.clientX, y: event.clientY, item });
    if (item) {
      const isSelected = selectedItems.some((sel) => sel.id === item.id);
      if (!isSelected) setSelectedItems([item]);
    }
  };

  const closeMenu = useCallback(() => {
    setMenuState((prev) => ({ ...prev, visible: false }));
  }, []);

  useEffect(() => {
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, [closeMenu]);

  // ✅ Click chọn item
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

  // ✅ Double click mở file / folder
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

  // ✅ Chọn thư mục
  const handleSelectDirectory = (dir, path) => {
    setFilters.setSelectedDir(dir);
    setBreadcrumbPath(path || []);
  };

  // ✅ Bỏ chọn khi click vùng trống
  const handleContainerClick = (e) => {
    if (
      e.target.classList.contains("documents-page") ||
      e.target.classList.contains("kanban-container-wrapper")
    ) {
      setSelectedItems([]);
    }
  };

  // Hàm helper xử lý logic chung cho cả Move và Copy
  const processDropAction = async (actionFn, items, targetDirId) => {
    try {
      // Tách riêng thư mục và tệp tin, vì chỉ cần kiểm tra xung đột tên tệp tin
      const directories = items.filter((it) => it.type === "directory");
      const files = items.filter((it) => it.type === "file");
      const fileNames = files.map((f) => f.name);

      let filesToProcess = files; // Mặc định xử lý tất cả tệp

      // Chỉ thực hiện kiểm tra nếu có tệp tin được kéo/thả
      if (fileNames.length > 0) {
        const existingNames = await checkExistingFiles(targetDirId, fileNames);

        if (existingNames.length > 0) {
          // Lọc ra những tệp bị xung đột
          const nonConflictingFiles = files.filter(
            (f) => !existingNames.includes(f.name)
          );

          const message = `Các tệp sau đã tồn tại trong thư mục đích:\n\n- ${existingNames.join(
            "\n- "
          )}\n\nBạn có muốn giữ cả hai không? (Tệp mới sẽ được tự động đổi tên)`;

          if (window.confirm(message)) {
            // Nếu người dùng đồng ý, chúng ta vẫn xử lý tất cả
            filesToProcess = files;
          } else {
            // Nếu không, chỉ xử lý những tệp không bị xung đột
            filesToProcess = nonConflictingFiles;
          }
        }
      }

      // Tổng hợp lại danh sách cuối cùng cần xử lý
      const finalItemsToProcess = [...directories, ...filesToProcess];

      if (finalItemsToProcess.length === 0) return;

      for (const item of finalItemsToProcess) {
        const model = item.type === "directory" ? "dms.directory" : "dms.file";
        await actionFn(model, item.id, targetDirId);
      }

      await refresh();
      broadcastRefresh();
    } catch (err) {
      const actionName = actionFn.name.includes("copy")
        ? "sao chép"
        : "di chuyển";
      alert(`Lỗi: Không thể ${actionName} một hoặc nhiều mục.`);
      console.error(err);
    }
  };

  // ✅ Di chuyển & Sao chép
  const handleMoveItems = async (items, targetDirId) => {
    await processDropAction(moveItem, items, targetDirId);
  };

  const handleCopyItems = async (items, targetDirId) => {
    await processDropAction(copyItem, items, targetDirId);
  };
  const handleConfirmMove = (destinationDirId) => {
    handleMoveItems(itemsToMove, destinationDirId);
    setShowMoveModal(false);
  };

  // ✅ Context menu actions
  const handleItemAction = (actionId, currentItem) => {
    const baseUrl =
      process.env.REACT_APP_ODOO_BASE_URL || "http://localhost:8069";

    switch (actionId) {
      case "new_folder":
        return setShowNewFolderModal(true);

      case "move": {
        const items = selectedItems.includes(currentItem)
          ? selectedItems
          : [currentItem];
        setItemsToMove(items);
        setShowMoveModal(true);
        break;
      }

      case "copy":
        return setClipboard({ action: "copy", item: currentItem });

      case "cut":
        return setClipboard({ action: "cut", item: currentItem });

      case "paste": {
        if (!clipboard) return;
        const targetDirId =
          currentItem?.type === "directory"
            ? currentItem.id
            : filters.selectedDir?.id;
        const model =
          clipboard.item.type === "directory" ? "dms.directory" : "dms.file";
        const fn =
          clipboard.action === "copy"
            ? copyItem(model, clipboard.item.id, targetDirId)
            : moveItem(model, clipboard.item.id, targetDirId);
        fn.then(() => {
          refresh();
          if (clipboard.action === "cut") setClipboard(null);
        }).catch(alert);
        break;
      }

      case "delete":
        if (
          currentItem &&
          window.confirm(`Bạn có chắc muốn xóa "${currentItem.name}" không?`)
        ) {
          const model =
            currentItem.type === "directory" ? "dms.directory" : "dms.file";
          deleteItem(model, currentItem.id).then(refresh).catch(alert);
        }
        break;

      case "rename": {
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

      case "download":
        if (currentItem?.type === "file" && currentItem.access_url) {
          window.open(`${baseUrl}${currentItem.access_url}`, "_blank");
        }
        break;

      default:
        break;
    }
  };

  const handleCreateFolder = (name) => {
    createDirectory(name, filters.selectedDir?.id)
      .then(() => {
        setShowNewFolderModal(false);
        refresh();
      })
      .catch(alert);
  };

  return (
    <>
      <DndProvider backend={HTML5Backend}>
        <div
          className="documents-page d-flex"
          onContextMenu={(e) => handleContextMenu(e, null)}
          onClick={handleContainerClick}>
          <div className="flex-grow-1 p-3">
            {/* HEADER */}
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

            {/* Breadcrumbs & Toolbar */}
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

            {/* CONTENT */}
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" />
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
                onContextMenu={(e) => handleContextMenu(e, null)}
                onClick={handleContainerClick}>
                <DmsKanbanView
                  immediateItems={immediateItems}
                  allItems={allItems}
                  onContextMenu={handleContextMenu}
                  breadcrumbPath={breadcrumbPath}
                  selectedItems={selectedItems}
                  onItemClick={handleItemClick}
                  onItemDoubleClick={handleItemDoubleClick}
                  onMoveItem={handleMoveItems}
                  onCopyItem={handleCopyItems}
                  isCtrlPressed={isCtrlPressed}
                  currentDirId={filters.selectedDir?.id || false}
                />
              </div>
            )}

            {/* Modals */}
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
      <CustomContextMenu
        menuState={menuState}
        onAction={handleItemAction}
        clipboard={clipboard}
      />
    </>
  );
};

export default DocumentsPage;
