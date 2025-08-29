import React, { useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

function LoginPage() {
  const [identifier, setIdentifier] = useState("admin"); // Có thể đặt giá trị mặc định để test
  const [password, setPassword] = useState("admin"); // Có thể đặt giá trị mặc định để test

  // Lấy state và hàm từ Context. `error` giờ đã chứa thông báo lỗi chi tiết.
  const { handleLogin, isLoading, error } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    const sessionInfo = await handleLogin(identifier, password);

    // Nếu đăng nhập thành công, sessionInfo sẽ có giá trị
    if (sessionInfo) {
      // Điều hướng đến trang dashboard hoặc trang chính
      navigate("/dashboard");
    }
  };

  return (
    <div className="login-container">
      <h2>Đăng nhập</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="identifier">Email hoặc username</label>
          <input
            type="text"
            id="identifier"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="Email hoặc username"
            required
            autoFocus
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Mật khẩu</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <p className="error-message">{error}</p>}

        <button type="submit" disabled={isLoading}>
          {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>
    </div>
  );
}

export default LoginPage;
