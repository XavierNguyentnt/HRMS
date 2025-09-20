// src/components/Pages/project_components/ColumnFilter.js
import React from "react";
import { FaSlidersH } from "react-icons/fa";
import { Dropdown, Form } from "react-bootstrap";

const ColumnFilter = ({ columns, visibleColumns, onColumnToggle }) => {
  return (
    <Dropdown>
      <Dropdown.Toggle variant="outline-secondary" id="dropdown-column-filter">
        <FaSlidersH />
      </Dropdown.Toggle>

      <Dropdown.Menu>
        {columns.map((col) => (
          <Dropdown.ItemText key={col.key}>
            <Form.Check
              type="checkbox"
              id={`col-${col.key}`}
              label={col.label}
              checked={visibleColumns.includes(col.key)}
              onChange={() => onColumnToggle(col.key)}
            />
          </Dropdown.ItemText>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default ColumnFilter;
