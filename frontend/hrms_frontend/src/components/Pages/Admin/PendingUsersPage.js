// src/components/Pages/Admin/PendingUsersPage.js
import React, { useEffect, useState } from "react";
import { Table, Button, Spinner, Alert, Container } from "react-bootstrap";
import { useAuth } from "../../../contexts/AuthContext";

function PendingUsersPage() {
  const { apiFetch, currentUser } = useAuth(); // apiFetch là wrapper fetch tới Odoo API
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [approvingId, setApprovingId] = useState(null);

  const fetchPendingUsers = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/users/pending");
      if (res.success) {
        setPendingUsers(res.users);
      } else {
        setError(res.error || "Không lấy được danh sách user");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  const handleApprove = async (userId) => {
    setApprovingId(userId);
    try {
      const res = await apiFetch("/api/users/approve", "POST", {
        user_id: userId,
      });
      if (res.success) {
        setPendingUsers((prev) => prev.filter((u) => u.id !== userId));
      } else {
        setError(res.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setApprovingId(null);
    }
  };

  useEffect(() => {
    fetchPendingUsers();
  }, [fetchPendingUsers]);

  if (!currentUser?.isAdmin) {
    return (
      <Alert variant="danger">Bạn không có quyền truy cập trang này</Alert>
    );
  }

  return (
    <Container className="mt-4">
      <h2>Danh sách user chờ phê duyệt</h2>
      {loading && <Spinner animation="border" />}
      {error && <Alert variant="danger">{error}</Alert>}
      {!loading && pendingUsers.length === 0 && (
        <p>Không có user chờ phê duyệt.</p>
      )}

      {!loading && pendingUsers.length > 0 && (
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>#</th>
              <th>Họ và Tên</th>
              <th>Email</th>
              <th>Email Verified</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingUsers.map((user, idx) => (
              <tr key={user.id}>
                <td>{idx + 1}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.email_verified ? "✅" : "❌"}</td>
                <td>
                  <Button
                    size="sm"
                    variant="success"
                    disabled={!user.email_verified || approvingId === user.id}
                    onClick={() => handleApprove(user.id)}>
                    {approvingId === user.id
                      ? "Đang phê duyệt..."
                      : "Phê duyệt"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Container>
  );
}

export default PendingUsersPage;
