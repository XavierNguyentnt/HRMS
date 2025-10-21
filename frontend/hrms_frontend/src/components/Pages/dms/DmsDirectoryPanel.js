// src/components/Pages/DMS/DmsDirectoryPanel.js
import React, { useEffect, useState, useMemo } from "react";
import { fetchDirectories } from "../../../services/api/dmsAPI";
import { FaCaretRight, FaCaretDown } from "react-icons/fa";
import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";

// 👇 1. THÊM ĐỊNH NGHĨA HÀM findPath VÀO ĐÂY
const findPath = (flatDirectories, dirId) => {
  if (!flatDirectories || flatDirectories.length === 0 || !dirId) return [];

  const map = new Map();
  flatDirectories.forEach((dir) => map.set(dir.id, dir));

  const path = [];
  let currentId = dirId;
  while (currentId && map.has(currentId)) {
    const currentDir = map.get(currentId);
    path.unshift(currentDir);
    currentId = currentDir.parent_id ? currentDir.parent_id[0] : null;
  }
  return path;
};

const DmsDirectoryPanel = ({ onSelectDirectory }) => {
  const [directories, setDirectories] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    const loadDirs = async () => {
      try {
        const dirs = await fetchDirectories();
        console.log("📂 DMS Directories received:", dirs);
        setDirectories(Array.isArray(dirs) ? dirs : []);
      } catch (err) {
        console.error("❌ Lỗi khi tải danh sách thư mục:", err);
      }
    };
    loadDirs();
  }, []);

  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // 👇 2. TẠO DANH SÁCH PHẲNG ĐỂ TRUYỀN VÀO findPath
  const flatDirectories = useMemo(() => {
    const flatten = (dirs) => {
      let list = [];
      for (const dir of dirs) {
        const { children, ...rest } = dir; // Tách children ra
        list.push(rest); // Chỉ push thông tin của dir hiện tại
        if (children) {
          list = list.concat(flatten(children));
        }
      }
      return list;
    };
    return flatten(directories);
  }, [directories]);

  const handleSelect = (dir) => {
    if (!dir) {
      setSelectedId(null);
      onSelectDirectory?.(null, []);
      return;
    }
    // 👇 3. GỌI HÀM VÀ CẬP NHẬT STATE KHI CLICK
    setSelectedId(dir.id); // Cập nhật ID được chọn
    const path = findPath(flatDirectories, dir.id);
    onSelectDirectory?.(dir, path);
  };

  const renderNode = (dir, level = 0, isLast = false) => {
    const hasChildren = dir.children && dir.children.length > 0;
    const isOpen = expanded[dir.id];
    const isActive = dir.id === selectedId;

    return (
      <li key={dir.id} className={`tree-node ${isLast ? "is-last" : ""}`}>
        <div className="d-flex align-items-center">
          <header
            className={`tree-node-header list-group-item-action d-flex align-items-center ${
              isActive ? "active" : ""
            }`}
            onClick={() => handleSelect(dir)}>
            {hasChildren ? (
              <button
                className="btn p-0 px-1 me-1"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(dir.id);
                }}>
                {isOpen ? (
                  <FaCaretDown size={12} />
                ) : (
                  <FaCaretRight size={12} />
                )}
              </button>
            ) : (
              <span className="tree-node-leaf-placeholder" />
            )}
            <span className="text-truncate">{dir.name}</span>
          </header>
        </div>

        {hasChildren && isOpen && (
          <ul className="tree-node-children list-group border-0 ps-0">
            {dir.children.map((child, index) =>
              renderNode(child, level + 1, index === dir.children.length - 1)
            )}
          </ul>
        )}
      </li>
    );
  };

  return (
    <div
      className="o_search_panel flex-grow-0 flex-shrink-0 h-100 pb-5 bg-view overflow-auto position-relative pe-1 ps-3"
      style={{ width: "280px", borderRight: "1px solid #e0e0e0" }}>
      <section className="o_search_panel_section o_search_panel_category">
        <header className="o_search_panel_section_header pt-4 pb-2 text-uppercase cursor-default">
          <i className="fa fa-folder o_search_panel_section_icon text-primary me-2"></i>
          <b>Thư mục</b>
        </header>

        <ul className="odoo-tree-view list-group d-block o_search_panel_field px-2 px-md-0">
          <li
            className={`tree-node is-last ${
              selectedId === null ? "active" : ""
            }`}
            onClick={() => handleSelect(null)}>
            <header
              className={`tree-node-header list-group-item-action d-flex align-items-center ${
                selectedId === null ? "active" : ""
              }`}>
              <span className="tree-node-leaf-placeholder" />
              <span className="text-truncate fw-bold">Tất cả</span>
            </header>
          </li>

          {directories.map((dir, index) =>
            renderNode(dir, 0, index === directories.length - 1)
          )}
        </ul>
      </section>
      <Link
        to="/documents/trash"
        className="btn btn-outline-secondary w-100 mt-3">
        <Trash2 size={16} className="me-2" />
        Thùng rác
      </Link>
    </div>
  );
};

export default DmsDirectoryPanel;
