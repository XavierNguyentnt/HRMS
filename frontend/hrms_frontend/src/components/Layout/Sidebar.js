import React, { useState } from "react";
import {
  Nav,
  Collapse,
  OverlayTrigger,
  Tooltip,
  Button,
} from "react-bootstrap";
import { NavLink, useLocation } from "react-router-dom";
import { useSidebar } from "../../contexts/SidebarContext"; // Import hook
import "./Layout.css";

import {
  HouseDoorFill,
  PersonFill,
  BriefcaseFill,
  Building,
  PeopleFill,
  ChevronDown,
  List,
} from "react-bootstrap-icons";

const Sidebar = () => {
  const location = useLocation();
  const { isSidebarOpen } = useSidebar(); // Lấy trạng thái từ context
  const { toggleSidebar } = useSidebar(); // Lấy hàm toggle từ context

  const [isProjectsOpen, setIsProjectsOpen] = useState(
    location.pathname.startsWith("/projects") ||
      location.pathname.startsWith("/tasks")
  );

  const renderTooltip = (text) => (
    <Tooltip
      id={`tooltip-${text.toLowerCase().replace(/\s+/g, "-")}`}
      className="sidebar-tooltip">
      {text}
    </Tooltip>
  );

  return (
    <div className={`sidebar ${isSidebarOpen ? "" : "collapsed"}`}>
      <OverlayTrigger
        placement="right"
        overlay={renderTooltip("Ẩn/Hiện Sidebar")}>
        <Button
          variant="link"
          onClick={toggleSidebar}
          className="sidebar-toggle-btn">
          <List size={24} />
        </Button>
      </OverlayTrigger>

      <Nav className="flex-column">
        {/* SỬA LỖI: Dùng prop `trigger` thay vì thay đổi `overlay` */}
        <OverlayTrigger
          placement="right"
          delay={{ show: 150, hide: 200 }}
          trigger={isSidebarOpen ? null : ["hover", "focus"]} // Chỉ kích hoạt khi sidebar đóng
          overlay={renderTooltip("Dashboard")}>
          <Nav.Item>
            <Nav.Link as={NavLink} to="/dashboard" className="sidebar-link">
              <HouseDoorFill className="sidebar-icon" />
              <span className="sidebar-link-text">Dashboard</span>
            </Nav.Link>
          </Nav.Item>
        </OverlayTrigger>

        <OverlayTrigger
          placement="right"
          delay={{ show: 150, hide: 200 }}
          trigger={isSidebarOpen ? null : ["hover", "focus"]}
          overlay={renderTooltip("Phòng Ban")}>
          <Nav.Item>
            <Nav.Link as={NavLink} to="/departments" className="sidebar-link">
              <Building className="sidebar-icon" />
              <span className="sidebar-link-text">Phòng Ban</span>
            </Nav.Link>
          </Nav.Item>
        </OverlayTrigger>

        <OverlayTrigger
          placement="right"
          delay={{ show: 150, hide: 200 }}
          trigger={isSidebarOpen ? null : ["hover", "focus"]}
          overlay={renderTooltip("Nhân Viên")}>
          <Nav.Item>
            <Nav.Link as={NavLink} to="/employees" className="sidebar-link">
              <PeopleFill className="sidebar-icon" />
              <span className="sidebar-link-text">Nhân Viên</span>
            </Nav.Link>
          </Nav.Item>
        </OverlayTrigger>

        {/* Dropdown cho Projects */}
        <OverlayTrigger
          placement="right"
          delay={{ show: 150, hide: 200 }}
          trigger={isSidebarOpen ? null : ["hover", "focus"]}
          overlay={renderTooltip("Dự án & Nhiệm vụ")}>
          <Nav.Item>
            <div
              onClick={() =>
                isSidebarOpen && setIsProjectsOpen(!isProjectsOpen)
              }
              aria-controls="projects-submenu"
              aria-expanded={isProjectsOpen}
              className={`sidebar-link dropdown-toggle ${
                !isSidebarOpen ? "disabled-click" : ""
              }`}>
              <BriefcaseFill className="sidebar-icon" />
              <span className="sidebar-link-text ">Dự án & Nhiệm vụ</span>
              <ChevronDown
                className={`chevron-icon ${isProjectsOpen ? "open" : ""}`}
              />
            </div>
            <Collapse in={isProjectsOpen && isSidebarOpen}>
              <div id="projects-submenu" className="sidebar-submenu">
                <NavLink to="/projects" className="nav-link" end>
                  Dashboard Dự án
                </NavLink>
                <NavLink to="/tasks?filter=my" className="nav-link" end>
                  Nhiệm vụ của tôi
                </NavLink>
                <NavLink to="/tasks?filter=all" className="nav-link" end>
                  Tất cả nhiệm vụ
                </NavLink>
              </div>
            </Collapse>
          </Nav.Item>
        </OverlayTrigger>

        <OverlayTrigger
          placement="right"
          delay={{ show: 150, hide: 200 }}
          trigger={isSidebarOpen ? null : ["hover", "focus"]}
          overlay={renderTooltip("Thông tin cá nhân")}>
          <Nav.Item>
            <Nav.Link as={NavLink} to="/profile" className="sidebar-link">
              <PersonFill className="sidebar-icon" />
              <span className="sidebar-link-text">Cá nhân</span>
            </Nav.Link>
          </Nav.Item>
        </OverlayTrigger>
      </Nav>
    </div>
  );
};

export default Sidebar;
