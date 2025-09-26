// src/components/Pages/dashboard_components/StatCard.js
import React from "react";
import { Card } from "react-bootstrap";
import { Link } from "react-router-dom"; // Import Link

// Thêm prop `linkTo`
const StatCard = ({ title, value, icon, color, linkTo }) => {
  const cardContent = (
    <Card className="stat-card" style={{ borderLeft: `5px solid ${color}` }}>
      <Card.Body className="d-flex align-items-center justify-content-between">
        <div>
          <div className="stat-title text-muted">{title}</div>
          <div className="stat-value">{value}</div>
        </div>
        <div className="stat-icon">{icon}</div>
      </Card.Body>
    </Card>
  );

  // Nếu có linkTo, bọc Card trong một thẻ Link
  if (linkTo) {
    return (
      <Link to={linkTo} className="text-decoration-none">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
};

export default StatCard;
