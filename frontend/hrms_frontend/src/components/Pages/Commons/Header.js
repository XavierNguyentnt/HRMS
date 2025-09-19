// src/components/Pages/Commons/Header.js
import React from "react";
import { Navbar, Nav, Container, NavDropdown, Image } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import "./Header.css";

function Header() {
  const { user, handleLogout } = useAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    handleLogout();
    navigate("/login");
  };

  return (
    <Navbar variant="light" expand="lg" sticky="top" className="header-bg">
      <Container fluid>
        <Image
          src="/logo/logo-duan.png" // Giả sử logo nằm trong thư mục public
          as={Link}
          to="/"
          style={{ height: "80px", marginRight: "20px" }}
        />
        <Navbar.Brand as={Link} to="/" className="fw-bold">
          QUẢN LÝ DỰ ÁN
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="main-navbar-nav" />
        <Navbar.Collapse id="main-navbar-nav">
          <Nav className="me-auto">
            {user && (
              <>
                <Nav.Link as={Link} to="/dashboard">
                  Bảng điều khiển
                </Nav.Link>
                <Nav.Link as={Link} to="/departments">
                  Phòng Ban
                </Nav.Link>
                <Nav.Link as={Link} to="/employees">
                  Nhân Viên
                </Nav.Link>

                {/* === THAY ĐỔI Ở ĐÂY === */}
                {/* Bỏ Dropdown và thay bằng một Nav.Link trực tiếp */}
                <Nav.Link as={Link} to="/projects">
                  Dự án
                </Nav.Link>
              </>
            )}
          </Nav>

          {/* User menu (giữ nguyên) */}
          <Nav>
            {user ? (
              <NavDropdown
                title={
                  <>
                    <Image
                      src={
                        user.image_1920
                          ? `data:image/jpeg;base64,${user.image_1920}`
                          : "/default-avatar.png"
                      }
                      roundedCircle
                      style={{
                        width: "30px",
                        height: "30px",
                        objectFit: "cover",
                        marginRight: "8px",
                      }}
                    />
                    {user.name}
                  </>
                }
                id="user-nav-dropdown"
                align="end">
                <NavDropdown.Item as={Link} to="/profile">
                  Thông tin cá nhân
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={onLogout}>
                  Đăng xuất
                </NavDropdown.Item>
              </NavDropdown>
            ) : (
              <Nav.Link as={Link} to="/login">
                Đăng nhập
              </Nav.Link>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default Header;
