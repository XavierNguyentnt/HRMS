import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  fetchSubDirectories,
  fetchImmediateFiles,
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
  const windowId = useMemo(
    () => Math.random().toString(36).substring(2, 9),
    []
  );

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

    if (item) {
      // Kiểm tra xem mục được nhấp chuột phải có nằm trong danh sách đã chọn hay không
      const isAlreadySelected = selectedItems.some(
        (sel) => sel.id === item.id && sel.type === item.type
      );

      // Nếu không, hãy xóa lựa chọn cũ và chỉ chọn mục này
      if (!isAlreadySelected) {
        setSelectedItems([item]);
      }
      // Ngược lại, nếu nó đã nằm trong vùng chọn, giữ nguyên vùng chọn đó
    }

    setMenuState({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      item, // item được nhấp chuột phải
    });
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
  const handleItemAction = useCallback(
    async (actionId, currentItem) => {
      const baseUrl =
        process.env.REACT_APP_ODOO_BASE_URL || "http://localhost:8069";

      // Nguồn đáng tin cậy cho mọi hành động là `selectedItems`
      const itemsToAction = selectedItems;
      // if (itemsToAction.length === 0) return;

      switch (actionId) {
        case "new_folder":
          return setShowNewFolderModal(true);

        case "move": {
          setItemsToMove(itemsToAction);
          setShowMoveModal(true);
          break;
        }

        case "copy":
          // Đưa tất cả các mục đã chọn vào clipboard
          return setClipboard({ action: "copy", items: itemsToAction });

        case "cut":
          // Đưa tất cả các mục đã chọn vào clipboard
          return setClipboard({ action: "cut", items: itemsToAction });

        case "paste": {
          if (!clipboard?.items?.length) return;

          const targetDirId =
            currentItem?.type === "directory"
              ? currentItem.id
              : filters.selectedDir?.id;

          // Giữ nguyên logic cho "Cắt-Dán" (di chuyển)
          if (clipboard.action === "cut") {
            const promises = clipboard.items.map((itemToPaste) => {
              const model =
                itemToPaste.type === "directory" ? "dms.directory" : "dms.file";
              return moveItem(model, itemToPaste.id, targetDirId);
            });
            try {
              await Promise.all(promises);
              setClipboard(null);
            } catch (error) {
              console.error("Lỗi khi di chuyển (cắt-dán):", error);
              alert("Đã xảy ra lỗi khi di chuyển một hoặc nhiều mục.");
              return;
            }
          }

          // ✅ [SỬA LỖI & NÂNG CẤP] LOGIC MỚI CHO "SAO CHÉP-DÁN"
          if (clipboard.action === "copy") {
            try {
              // 1. Lấy danh sách tên các mục đã có trong thư mục đích
              const [subDirs, immediateFiles] = await Promise.all([
                fetchSubDirectories(targetDirId),
                fetchImmediateFiles(targetDirId),
              ]);
              const existingNames = new Set([
                ...subDirs.map((d) => d.name),
                ...immediateFiles.map((f) => f.name),
              ]);

              // 2. [NÂNG CẤP] Hàm helper tìm ra tên gốc và phần mở rộng
              const getBaseNameAndExtension = (name) => {
                const dotIndex = name.lastIndexOf(".");
                const extension =
                  dotIndex !== -1 ? name.substring(dotIndex) : "";
                let nameWithoutExt =
                  dotIndex !== -1 ? name.substring(0, dotIndex) : name;

                // Regex để tìm các hậu tố copy như " (copy)", " (copy 1)", hoặc " (1)"
                const copyPattern = /\s\((copy|copy \d+|\d+)\)$/;
                const match = nameWithoutExt.match(copyPattern);

                if (match) {
                  // Nếu tìm thấy hậu tố, tên gốc là phần đứng trước nó
                  const baseName = nameWithoutExt
                    .substring(0, match.index)
                    .trim();
                  return { baseName, extension };
                }
                // Nếu không, toàn bộ tên (bỏ phần mở rộng) là tên gốc
                return { baseName: nameWithoutExt, extension };
              };

              // 3. [NÂNG CẤP] Hàm helper tạo tên duy nhất theo style Google Drive
              const generateUniqueName = (name) => {
                const { baseName, extension } = getBaseNameAndExtension(name);

                let counter = 1;
                while (true) {
                  const newName = `${baseName} (copy ${counter})${extension}`;
                  if (!existingNames.has(newName)) {
                    return newName;
                  }
                  counter++;
                }
              };

              // 4. Thực hiện tuần tự để chống race condition
              for (const itemToPaste of clipboard.items) {
                const model =
                  itemToPaste.type === "directory"
                    ? "dms.directory"
                    : "dms.file";

                let finalName = itemToPaste.name;
                if (existingNames.has(finalName)) {
                  finalName = generateUniqueName(finalName);
                }

                // Bước 4.1: Tạo bản sao, để Odoo tự đặt tên tạm thời
                const newId = await copyItem(
                  model,
                  itemToPaste.id,
                  targetDirId
                );
                if (!newId) {
                  throw new Error(
                    `Không thể tạo bản sao cho ${itemToPaste.name}`
                  );
                }

                // Bước 4.2: Ngay lập tức đổi tên bản sao đó thành tên chúng ta muốn
                await renameItem(model, newId, finalName);

                // Bước 4.3: Cập nhật Set để vòng lặp tiếp theo biết tên này đã được sử dụng
                existingNames.add(finalName);
              }
            } catch (error) {
              console.error("Lỗi khi sao chép (sao chép-dán):", error);
              // Hiển thị lại thông báo lỗi như trong ảnh
              alert("Đã xảy ra lỗi khi sao chép một hoặc nhiều mục.");
              await refresh();
              broadcastRefresh();
              return;
            }
          }

          // Sau khi hoàn thành, làm mới dữ liệu
          await refresh();
          broadcastRefresh();
          break;
        }

        case "delete": {
          const message = `Bạn có chắc muốn xóa vĩnh viễn ${itemsToAction.length} mục đã chọn không?`;
          if (window.confirm(message)) {
            const promises = itemsToAction.map((itemToDelete) => {
              const model =
                itemToDelete.type === "directory"
                  ? "dms.directory"
                  : "dms.file";
              return deleteItem(model, itemToDelete.id);
            });

            try {
              await Promise.all(promises);
              await refresh();
              broadcastRefresh();
              setSelectedItems([]); // Xóa lựa chọn sau khi xóa thành công
            } catch (error) {
              console.error("Lỗi khi xóa:", error);
              alert("Đã xảy ra lỗi khi xóa một hoặc nhiều mục.");
            }
          }
          break;
        }

        case "rename": {
          // Đổi tên chỉ cho phép khi chọn một mục duy nhất
          if (itemsToAction.length !== 1) {
            return; // Không làm gì nếu chọn nhiều hơn 1
          }
          const itemToRename = itemsToAction[0];
          const newName = window.prompt("Nhập tên mới:", itemToRename.name);
          if (newName && newName.trim() && newName !== itemToRename.name) {
            const model =
              itemToRename.type === "directory" ? "dms.directory" : "dms.file";
            renameItem(model, itemToRename.id, newName.trim())
              .then(() => {
                refresh();
                broadcastRefresh();
              })
              .catch(alert);
          }
          break;
        }

        case "download": {
          // Lọc ra các tệp tin có thể tải xuống
          const filesToDownload = itemsToAction.filter(
            (item) => item.type === "file" && item.access_url
          );

          if (filesToDownload.length === 0) {
            alert(
              "Không có tệp nào hợp lệ để tải xuống trong các mục đã chọn."
            );
            return;
          }

          // Mở tab mới để tải cho mỗi tệp
          filesToDownload.forEach((file) => {
            window.open(`${baseUrl}${file.access_url}`, "_blank");
          });
          break;
        }
        default:
          break;
      }
    },
    [clipboard, filters.selectedDir, selectedItems, refresh]
  );

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Bỏ qua nếu người dùng đang gõ trong ô input hoặc textarea
      const activeElement = document.activeElement;
      if (
        activeElement.tagName === "INPUT" ||
        activeElement.tagName === "TEXTAREA"
      ) {
        return;
      }

      // --- Xử lý Ctrl + C (Copy) và Ctrl + X (Cut) ---
      if (
        e.ctrlKey &&
        (e.key.toLowerCase() === "c" || e.key.toLowerCase() === "x")
      ) {
        if (selectedItems.length > 0) {
          e.preventDefault(); // Ngăn hành vi mặc định của trình duyệt
          const action = e.key.toLowerCase() === "c" ? "copy" : "cut";
          setClipboard({ action, items: selectedItems });
          // Tùy chọn: Thêm một thông báo toast nhỏ ở đây để báo đã copy/cut
        }
      }

      // --- Xử lý Ctrl + V (Paste) ---
      if (e.ctrlKey && e.key.toLowerCase() === "v") {
        if (clipboard) {
          e.preventDefault();
          // Gọi hàm paste, truyền `null` cho currentItem để nó dán vào thư mục hiện tại
          handleItemAction("paste", null);
        }
      }

      // --- Xử lý Delete và Shift + Delete ---
      if (e.key === "Delete") {
        if (selectedItems.length > 0) {
          e.preventDefault();
          // Cả Delete và Shift+Delete đều sẽ gọi hành động 'delete'
          // Logic xác nhận đã có sẵn bên trong handleItemAction
          handleItemAction("delete");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedItems, clipboard, handleItemAction]);

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
                  windowId={windowId}
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
        selectedItemCount={selectedItems.length}
      />
    </>
  );
};

export default DocumentsPage;
