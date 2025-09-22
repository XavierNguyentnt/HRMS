import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "react-bootstrap";

const TaskCard = ({ task }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: "grab",
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className="kanban-card mb-2">
        <Card.Body>
          <Card.Title className="h6">{task.name}</Card.Title>
          <Card.Text as="div" className="small">
            <div>
              <strong>Hạn:</strong> {task.date_deadline || "-"}
            </div>
            <div>
              <strong>Người TH:</strong>
              {task.user_ids && task.user_ids.length > 0
                ? task.user_ids.map((user) => user[1]).join(", ")
                : "-"}
            </div>
          </Card.Text>
        </Card.Body>
      </Card>
    </div>
  );
};

export default TaskCard;
