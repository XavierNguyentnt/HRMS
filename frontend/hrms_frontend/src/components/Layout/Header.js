import React from "react";
import { Navbar, Container, Nav, NavDropdown, Image } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import ThemeSwitcher from "./ThemeSwitcher";
import "./Layout.css";
import { BellFill, ChatDotsFill } from "react-bootstrap-icons";
import Avatar from "../shared/Avatar";

const Header = () => {
  const { user, handleLogout } = useAuth();

  const navigate = useNavigate();

  const onLogout = () => {
    handleLogout();
    navigate("/login");
  };

  let userPartnerId = null;
  if (user && user.partner_id) {
    // Kiểm tra xem partner_id là mảng [id, name] hay chỉ là một số id
    userPartnerId = Array.isArray(user.partner_id)
      ? user.partner_id[0]
      : user.partner_id;
  }

  return (
    <Navbar className="app-header" sticky="top">
      <Container fluid>
        <div className="d-flex align-items-center">
          <Navbar.Brand as={Link} to="/" className="fw-bold app-logo ms-3">
            <Image
              src="/logo/logo-duan.png"
              alt="HRMS App Logo"
              className="header-brand-logo"
              style={{ height: 60 }}
            />
            <span className="ms-2 d-none d-sm-inline">
              PHẦN MỀM QUẢN LÝ DỰ ÁN
            </span>
          </Navbar.Brand>
        </div>

        <Nav className="ms-auto d-flex flex-row align-items-center">
          <ThemeSwitcher />
          <Nav.Link href="#notifications" className="header-icon">
            <BellFill size={20} />
          </Nav.Link>
          <Nav.Link href="#chat" className="header-icon">
            <ChatDotsFill size={20} />
          </Nav.Link>

          {user && (
            <NavDropdown
              title={
                <Avatar
                  partnerId={userPartnerId}
                  altText={user.name}
                  size={40} // Kích thước phù hợp cho header
                  className="header-avatar"
                />
              }
              id="user-nav-dropdown"
              align="end">
              <NavDropdown.ItemText className="fw-bold">
                {user.name}
              </NavDropdown.ItemText>
              <NavDropdown.Divider />
              <NavDropdown.Item as={Link} to="/profile">
                Thông tin cá nhân
              </NavDropdown.Item>
              <NavDropdown.Item onClick={onLogout}>Đăng xuất</NavDropdown.Item>
            </NavDropdown>
          )}
        </Nav>
      </Container>
    </Navbar>
  );
};

export default Header;
