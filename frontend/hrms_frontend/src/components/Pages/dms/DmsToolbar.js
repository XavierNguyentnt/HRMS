// src/components/Pages/DMS/DmsToolbar.js
import React, { useState } from "react";
import { InputGroup, Form, Button } from "react-bootstrap";
import {
  Search,
  List,
  LayoutGrid,
  SlidersHorizontal,
  Calendar,
} from "lucide-react";

const DmsToolbar = ({
  onSearch,
  onSortChange,
  onViewChange,
  onDateFilter,
  currentView = "list",
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("create_date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    onSearch?.(val);
  };

  const handleSortChange = (e) => {
    const value = e.target.value;
    const [field, order] = value.split(":");
    setSortField(field);
    setSortOrder(order);
    onSortChange?.({ field, order });
  };

  const handleDateChange = (type, val) => {
    if (type === "from") setDateFrom(val);
    if (type === "to") setDateTo(val);
    onDateFilter?.({
      from: type === "from" ? val : dateFrom,
      to: type === "to" ? val : dateTo,
    });
  };

  return (
    <div
      className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2 p-2 bg-light rounded"
      style={{ border: "1px solid #ddd" }}>
      {/* 🔍 Search */}
      <InputGroup style={{ maxWidth: 300 }}>
        <InputGroup.Text>
          <Search size={16} />
        </InputGroup.Text>
        <Form.Control
          type="text"
          placeholder="Tìm kiếm tệp..."
          value={searchTerm}
          onChange={handleSearch}
        />
      </InputGroup>

      {/* 🧭 Sort */}
      <InputGroup style={{ maxWidth: 350 }}>
        <InputGroup.Text>
          <SlidersHorizontal size={16} />
        </InputGroup.Text>
        <Form.Select
          value={`${sortField}:${sortOrder}`}
          onChange={handleSortChange}>
          <option value="name:asc">Tên (A → Z)</option>
          <option value="name:desc">Tên (Z → A)</option>
          <option value="human_size:asc">Kích thước (tăng dần)</option>
          <option value="human_size:desc">Kích thước (giảm dần)</option>
          <option value="create_date:desc">Ngày tạo (mới nhất)</option>
          <option value="create_date:asc">Ngày tạo (cũ nhất)</option>
          <option value="create_uid:asc">Người tạo (A → Z)</option>
          <option value="create_uid:desc">Người tạo (Z → A)</option>
        </Form.Select>
      </InputGroup>

      {/* 📅 Date Filter */}
      <div className="d-flex align-items-center gap-2">
        <InputGroup size="sm">
          <InputGroup.Text>
            <Calendar size={16} />
          </InputGroup.Text>
          <Form.Control
            type="date"
            value={dateFrom}
            onChange={(e) => handleDateChange("from", e.target.value)}
          />
        </InputGroup>
        <span>→</span>
        <InputGroup size="sm">
          <Form.Control
            type="date"
            value={dateTo}
            onChange={(e) => handleDateChange("to", e.target.value)}
          />
        </InputGroup>
      </div>

      {/* 🔄 View Mode Switch */}
      <div className="d-flex gap-2">
        <Button
          variant={currentView === "list" ? "primary" : "outline-secondary"}
          size="sm"
          onClick={() => onViewChange?.("list")}>
          <List size={16} />
        </Button>
        <Button
          variant={currentView === "kanban" ? "primary" : "outline-secondary"}
          size="sm"
          onClick={() => onViewChange?.("kanban")}>
          <LayoutGrid size={16} />
        </Button>
      </div>
    </div>
  );
};

export default DmsToolbar;
