// src/components/Pages/DMS/DmsDirectoryPanel.js
import React, { useEffect, useState } from "react";
import { fetchDirectories } from "../../../services/api/dmsAPI";
import { Folder } from "lucide-react";
import { FaCaretRight, FaCaretDown } from "react-icons/fa";

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

  // toggle mở/đóng thư mục
  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSelect = (dir) => {
    if (!dir) {
      setSelectedId(null);
      onSelectDirectory?.(null);
      return;
    }
    setSelectedId(dir.id);
    onSelectDirectory?.(dir);
  };

  const renderNode = (dir, level = 0) => {
    const hasChildren = dir.children && dir.children.length > 0;
    const isOpen = expanded[dir.id];
    const isActive = dir.id === selectedId;

    return (
      <li
        key={dir.id}
        className="o_search_panel_category_value list-group-item py-1 cursor-pointer border-0 pe-0 ps-0">
        <header
          className={`list-group-item list-group-item-action d-flex align-items-center px-0 py-lg-0 border-0 ${
            isActive ? "active text-900 fw-bold text-primary" : ""
          }`}
          onClick={() => handleSelect(dir)}
          style={{ paddingLeft: `${level * 12}px` }}>
          <div
            className="o_search_panel_label d-flex align-items-center overflow-hidden w-100 cursor-pointer mb-0 o_with_counters"
            title={dir.name}>
            {/* Nút mở/đóng */}
            {hasChildren ? (
              <button
                className="btn p-0 px-1 flex-shrink-0 text-center text-muted"
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
              <span className="px-2" />
            )}

            {/* Tên thư mục */}
            <span
              className={`text-truncate ${
                isActive ? "fw-bold text-primary" : ""
              }`}>
              {dir.name}
            </span>
          </div>

          {/* Counter */}
          {dir.count_files > 0 && (
            <small className="o_search_panel_counter text-muted mx-2 fw-bold">
              {dir.count_files}
            </small>
          )}
        </header>

        {/* Đệ quy con */}
        {hasChildren && isOpen && (
          <ul className="list-group border-0 ps-0">
            {dir.children.map((child) => renderNode(child, level + 1))}
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

        <ul className="list-group d-block o_search_panel_field px-2 px-md-0">
          <li
            className={`o_search_panel_category_value list-group-item py-1 cursor-pointer border-0 pe-0 ps-0 ${
              selectedId === null ? "active text-900 fw-bold text-primary" : ""
            }`}
            onClick={() => handleSelect(null)}>
            <header className="list-group-item list-group-item-action d-flex align-items-center px-0 py-lg-0 border-0">
              <div className="o_search_panel_label d-flex align-items-center overflow-hidden w-100 cursor-pointer mb-0 o_with_counters">
                <span className="o_search_panel_label_title text-truncate fw-bold">
                  Tất cả
                </span>
              </div>
            </header>
          </li>

          {directories.map((dir) => renderNode(dir))}
        </ul>
      </section>
    </div>
  );
};

export default DmsDirectoryPanel;
