// src/components/Routes/AdminRoute.js
import React from "react";
import { Spinner } from "react-bootstrap";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function AdminRoute({ children }) {
  const { currentUser, loading } = useAuth(); // loading nếu fetch user info từ API
  console.log("currentUser", currentUser);

  if (loading) return <Spinner animation="border" />;

  if (!currentUser) return <Navigate to="/login" />;

  if (!currentUser.isAdmin) return <Navigate to="/dashboard" />;

  return children;
}
