// src/components/Pages/dashboard_components/MyTasksWidget.js
import React from "react";
import { Card, ListGroup, Button } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom"; // Import Link và useNavigate

const MyTasksWidget = ({ tasks }) => {
  const navigate = useNavigate();

  return (
    <Card className="h-100">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center">
          <Card.Title>Công việc của tôi</Card.Title>
          <Button
            variant="link"
            size="sm"
            onClick={() => navigate("/tasks?filter=my")}>
            Xem tất cả
          </Button>
        </div>
        <ListGroup variant="flush" className="mt-2">
          {tasks.length > 0 ? (
            tasks.map((task) => (
              <ListGroup.Item
                key={task.id}
                action // Prop này làm cho item có thể click
                as={Link} // Render như một thẻ Link
                to={`/projects/${task.project_id[0]}/tasks/${task.id}`} // Đường dẫn chi tiết
                className="d-flex justify-content-between align-items-center">
                <div>
                  <span className="fw-bold">{task.name}</span>
                  <small className="d-block text-muted">
                    {task.project_id[1]}
                  </small>
                </div>
                <span
                  className={`badge bg-${
                    task.priority === "1" ? "danger" : "secondary"
                  }`}>
                  {task.priority === "1" ? "Cao" : "Thường"}
                </span>
              </ListGroup.Item>
            ))
          ) : (
            <p className="text-muted p-2">
              Bạn không có công việc nào sắp tới.
            </p>
          )}
        </ListGroup>
      </Card.Body>
    </Card>
  );
};

export default MyTasksWidget;
