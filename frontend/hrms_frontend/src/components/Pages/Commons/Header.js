import React from "react";
import { Navbar, Nav, Container, NavDropdown, Image } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import "./Header.css";

// Component Header chung cho toàn bộ ứng dụng
function Header() {
  const { user, handleLogout } = useAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    handleLogout();
    navigate("/login");
  };

  return (
    <Navbar variant="light  " expand="lg" sticky="top" className="header-bg">
      <Container>
        {/* Logo hoặc tên ứng dụng */}
        <Image
          src="../../../../../../logo/logo-duan.png"
          as={Link}
          to="/"
          style={{ height: "9vh", marginRight: "30px" }}></Image>
        <Navbar.Brand as={Link} to="/" className="fw-bold">
          Quản lý Dự án
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="main-navbar-nav" />
        <Navbar.Collapse id="main-navbar-nav">
          {/* Các link điều hướng chính (hiển thị khi đã đăng nhập) */}
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
                <Nav.Link as={Link} to="/projects">
                  Các dự án
                </Nav.Link>
                {/* Thêm các link khác tại đây */}
              </>
            )}
          </Nav>

          {/* Các link và thông tin người dùng ở bên phải */}
          <Nav>
            {user ? (
              // Nếu đã đăng nhập, hiển thị dropdown menu của user
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
              // Nếu chưa đăng nhập, hiển thị link Login và Register
              <>
                <Nav.Link as={Link} to="/login">
                  Đăng nhập
                </Nav.Link>
                <Nav.Link as={Link} to="/register">
                  Đăng ký
                </Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default Header;
