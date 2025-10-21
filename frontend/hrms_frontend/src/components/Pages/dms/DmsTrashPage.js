// src/components/pages/DmsTrashPage.js
import React, { useState, useEffect } from "react";
import { Button, Spinner, Table, Form } from "react-bootstrap";
import { Link } from "react-router-dom";
import { ArrowLeft, Trash2, RotateCcw } from "lucide-react";
import {
  fetchTrashedItems,
  restoreItems,
  deletePermanently,
  emptyTrash,
} from "../../../services/api/dmsAPI";
import TrashContextMenu from "../dms/TrashContextMenu"; // Tạo mới ở bước 2

const DmsTrashPage = () => {
  const [trashedItems, setTrashedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);
  const [menuState, setMenuState] = useState({
    visible: false,
    x: 0,
    y: 0,
    item: null,
  });

  // Load danh sách thùng rác
  const loadTrash = async () => {
    setLoading(true);
    try {
      const items = await fetchTrashedItems();
      setTrashedItems(items);
    } catch (error) {
      alert("Không thể tải dữ liệu từ thùng rác.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrash();
  }, []);

  // Chọn item bằng checkbox
  const handleSelectItem = (itemId) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === trashedItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(trashedItems.map((i) => i.id));
    }
  };

  // Xử lý chuột phải
  const handleTrashContextMenu = (event, item) => {
    event.preventDefault();
    setMenuState({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      item,
    });
  };

  const handleAction = async (action) => {
    if (!menuState.item) return;

    const id = menuState.item.id;
    if (action === "restore") {
      if (window.confirm("Khôi phục mục này?")) {
        await restoreItems([id]);
        loadTrash();
      }
    } else if (action === "delete_permanent") {
      if (window.confirm("Xóa vĩnh viễn mục này?")) {
        await deletePermanently([id]);
        loadTrash();
      }
    }
    setMenuState({ visible: false });
  };

  const handleRestore = async () => {
    if (selectedItems.length === 0) return;
    if (window.confirm(`Khôi phục ${selectedItems.length} mục đã chọn?`)) {
      await restoreItems(selectedItems);
      loadTrash();
      setSelectedItems([]);
    }
  };

  const handleDeletePermanently = async () => {
    if (selectedItems.length === 0) return;
    if (
      window.confirm(
        `Hành động này KHÔNG THỂ HOÀN TÁC! Xóa vĩnh viễn ${selectedItems.length} mục?`
      )
    ) {
      await deletePermanently(selectedItems);
      loadTrash();
      setSelectedItems([]);
    }
  };

  const handleEmptyTrash = async () => {
    if (
      window.confirm(
        "⚠️ Hành động này KHÔNG THỂ HOÀN TÁC!\nBạn có chắc muốn DỌN SẠCH toàn bộ thùng rác không?"
      )
    ) {
      try {
        await emptyTrash();
        alert("✅ Đã dọn sạch thùng rác thành công!");
        loadTrash();
      } catch (err) {
        alert("❌ Lỗi khi dọn sạch thùng rác: " + err.message);
      }
    }
  };

  return (
    <div className="p-4" onClick={() => setMenuState({ visible: false })}>
      <Link to="/documents" className="btn btn-outline-secondary mb-4">
        <ArrowLeft size={16} className="me-2" /> Quay lại Quản lý tài liệu
      </Link>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="fw-bold mb-0">🗑️ Thùng rác</h4>
        <div>
          <Button
            variant="outline-success"
            className="me-2"
            onClick={handleRestore}
            disabled={selectedItems.length === 0}>
            <RotateCcw size={16} className="me-1" /> Khôi phục
          </Button>
          <Button
            variant="outline-danger"
            className="me-2"
            onClick={handleDeletePermanently}
            disabled={selectedItems.length === 0}>
            <Trash2 size={16} className="me-1" /> Xóa vĩnh viễn
          </Button>
          <Button
            variant="danger"
            onClick={handleEmptyTrash}
            disabled={trashedItems.length === 0}>
            Dọn sạch thùng rác
          </Button>
        </div>
      </div>

      {loading ? (
        <Spinner animation="border" />
      ) : (
        <Table hover responsive>
          <thead>
            <tr>
              <th>
                <Form.Check
                  type="checkbox"
                  checked={
                    selectedItems.length === trashedItems.length &&
                    trashedItems.length > 0
                  }
                  onChange={handleSelectAll}
                />
              </th>
              <th>Tên tệp / thư mục</th>
              <th>Loại</th>
              <th>Ngày xóa</th>
            </tr>
          </thead>
          <tbody>
            {trashedItems.map((item) => (
              <tr
                key={item.id}
                onContextMenu={(e) => handleTrashContextMenu(e, item)}>
                <td>
                  <Form.Check
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={() => handleSelectItem(item.id)}
                  />
                </td>
                <td>{item.name}</td>
                <td>{item.type}</td>
                <td>{new Date(item.deleted_at).toLocaleDateString("vi-VN")}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <TrashContextMenu menuState={menuState} onAction={handleAction} />
    </div>
  );
};

export default DmsTrashPage;
