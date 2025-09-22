import React from "react";
import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import TaskCard from "./TaskCard"; // Component cho từng thẻ task

const KanbanColumn = ({ id, title, tasks }) => {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div ref={setNodeRef} className="kanban-column">
      <h6 className="p-2 border-bottom">{title}</h6>
      <SortableContext id={id} items={tasks.map((t) => t.id)}>
        <div className="kanban-column-content">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
};

export default KanbanColumn;
