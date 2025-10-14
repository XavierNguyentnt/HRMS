// src/components/Pages/DMS/DocumentsPage.js
import React, { useState } from "react";
import { Menu, Item, useContextMenu } from "react-contexify";
import "react-contexify/dist/ReactContexify.css";
import { Button, Spinner } from "react-bootstrap";
import {
  Upload,
  Plus,
  PanelRightClose,
  PanelRightOpen,
  FolderPlus,
} from "lucide-react";

//Components
import DmsToolbar from "./DmsToolbar";
import DmsListView from "./DmsListView";
import DmsKanbanView from "./DmsKanbanView";
import DmsUploadModal from "./DmsUploadFileModal";
import DmsNewFileModal from "./DmsNewFileModal";
import DmsDirectoryPanel from "./DmsDirectoryPanel";
import DmsBreadcrumbs from "./DmsBreadcrumbs";
import DmsNewFolderModal from "./DmsNewFolderModal";

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

  const { show } = useContextMenu({
    id: MENU_ID,
  });

  // Lấy selectedDir để truyền cho Modal
  const [selectedDir, setSelectedDirState] = useState(null);
  const handleSelectDirectory = (dir, path) => {
    setSelectedDirState(dir);
    setFilters.setSelectedDir(dir);
    setBreadcrumbPath(path); // 👈 Cập nhật state đường dẫn
  };

  // { action: 'cut'|'copy', item: {...} }
  function handleContextMenu(event, item) {
    event.preventDefault();
    show({
      event,
      props: { item }, // Truyền item bị click vào menu
    });
  }

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

  return (
    <div className="documents-page d-flex">
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
        ) : immediateItems.length === 0 ? (
          <div className="text-center text-muted py-5">
            Không có tài liệu nào.
          </div>
        ) : viewMode === "list" ? (
          <DmsListView
            documents={allItems}
            onNavigate={handleSelectDirectory}
            onContextMenu={handleContextMenu}
            breadcrumbPath={breadcrumbPath}
          /> // List view vẫn dùng allItems
        ) : (
          <DmsKanbanView
            immediateItems={immediateItems}
            allItems={allItems}
            onNavigate={handleSelectDirectory}
            onContextMenu={handleContextMenu}
          /> // Hiển thị cả 2 trong Kanban
        )}

        <Menu id={MENU_ID} theme="light">
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
    </div>
  );
};

export default DocumentsPage;
