// src/components/Pages/DMS/DmsBreadcrumbs.js
import React from "react";
import { Breadcrumb } from "react-bootstrap";
import { Home } from "lucide-react";

const DmsBreadcrumbs = ({ path, onNavigate }) => {
  return (
    <Breadcrumb className="mb-2">
      <Breadcrumb.Item onClick={() => onNavigate(null, [])} href="#">
        <Home size={16} className="me-1" />
        Tất cả
      </Breadcrumb.Item>
      {path &&
        path.map((dir, index) => {
          const isLast = index === path.length - 1;
          return (
            <Breadcrumb.Item
              key={dir.id}
              active={isLast}
              onClick={() =>
                !isLast && onNavigate(dir, path.slice(0, index + 1))
              }
              href={!isLast ? "#" : undefined}>
              {dir.name}
            </Breadcrumb.Item>
          );
        })}
    </Breadcrumb>
  );
};

export default DmsBreadcrumbs;
