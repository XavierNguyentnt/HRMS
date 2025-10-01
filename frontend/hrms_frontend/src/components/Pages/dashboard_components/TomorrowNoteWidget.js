// src/components/Pages/dashboard_components/TomorrowNoteWidget.js
import React, { useState, useEffect } from "react";
import { Card, Form } from "react-bootstrap";

const TomorrowNoteWidget = () => {
  const [note, setNote] = useState("");

  useEffect(() => {
    const savedNote = localStorage.getItem("tomorrowNote") || "";
    setNote(savedNote);
  }, []);

  const handleNoteChange = (e) => {
    setNote(e.target.value);
    localStorage.setItem("tomorrowNote", e.target.value);
  };

  return (
    <Card className="h-100">
      <Card.Body>
        <Card.Title>
          <strong>Ghi chú cho Ngày mai</strong>
        </Card.Title>
        <Form.Control
          as="textarea"
          rows={8}
          value={note}
          onChange={handleNoteChange}
          placeholder="Viết ghi chú của bạn ở đây..."
          className="mt-2 border-0 p-0"
        />
      </Card.Body>
    </Card>
  );
};

export default TomorrowNoteWidget;
