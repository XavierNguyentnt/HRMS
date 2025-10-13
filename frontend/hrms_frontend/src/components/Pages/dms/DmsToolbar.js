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
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { vi } from "date-fns/locale";

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
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);

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

  const handleDateChange = (type, date) => {
    if (type === "from") setDateFrom(date);
    if (type === "to") setDateTo(date);

    onDateFilter?.({
      from:
        type === "from"
          ? date?.toISOString().split("T")[0]
          : dateFrom?.toISOString()?.split("T")[0],
      to:
        type === "to"
          ? date?.toISOString().split("T")[0]
          : dateTo?.toISOString()?.split("T")[0],
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
          <option value="size:asc">Kích thước (tăng dần)</option>
          <option value="size:desc">Kích thước (giảm dần)</option>
          <option value="create_date:desc">Ngày tạo (mới nhất)</option>
          <option value="create_date:asc">Ngày tạo (cũ nhất)</option>
          <option value="create_uid:asc">Người tạo (A → Z)</option>
          <option value="create_uid:desc">Người tạo (Z → A)</option>
        </Form.Select>
      </InputGroup>

      {/* 📅 Date Filter */}
      <div className="d-flex align-items-center gap-2">
        <InputGroup.Text>
          <Calendar size={16} />
        </InputGroup.Text>
        <InputGroup size="sm">
          <DatePicker
            selected={dateFrom}
            onChange={(date) => handleDateChange("from", date)}
            dateFormat="dd/MM/yyyy"
            placeholderText="Từ ngày"
            locale={vi}
            className="form-control form-control-sm"
            isClearable
          />
        </InputGroup>
        <span>→</span>
        <InputGroup size="sm">
          <DatePicker
            selected={dateTo}
            onChange={(date) => handleDateChange("to", date)}
            dateFormat="dd/MM/yyyy"
            placeholderText="Đến ngày"
            locale={vi}
            className="form-control form-control-sm"
            isClearable
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
