// src/components/Pages/task_components/Chatter.js
import React, { useState, useEffect, useRef } from "react";
import {
  Button,
  Spinner,
  Alert,
  InputGroup,
  FormControl,
} from "react-bootstrap";
import { FaSearch, FaPaperclip } from "react-icons/fa";
import { fetchMessages, createAttachment } from "../../../services/api";
import ChatMessage from "./ChatMessage";
import Followers from "./Followers";
import FollowButton from "./FollowButton";

const Chatter = ({ task, onUpdate }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    const loadMessages = async () => {
      if (!task?.message_ids || task.message_ids.length === 0) {
        setMessages([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const messageData = await fetchMessages(task.message_ids);
        setMessages(messageData);
      } catch (err) {
        setError("Không thể tải lịch sử trao đổi.");
      } finally {
        setLoading(false);
      }
    };
    loadMessages();
  }, [task.message_ids]);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64Data = reader.result.split(",")[1];
      try {
        await createAttachment({
          name: file.name,
          datas: base64Data,
          res_model: "project.task",
          res_id: task.id,
        });
        onUpdate();
      } catch (err) {
        alert("Lỗi khi đính kèm file: " + err.message);
      }
    };
    reader.onerror = () => alert("Không thể đọc file.");
  };

  const filteredMessages = messages.filter(
    (msg) =>
      (msg.body && msg.body.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (msg.author_id &&
        msg.author_id[1].toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="chatter-container">
      <div className="chatter-toolbar">
        {/* === PHẦN BỊ THIẾU: CÁC NÚT HÀNH ĐỘNG CHÍNH === */}
        <div className="chatter-actions">
          <Button variant="primary" size="sm" className="me-2">
            Gửi tin
          </Button>
          <Button variant="secondary" size="sm" className="me-2">
            Ghi chú
          </Button>
          <Button variant="secondary" size="sm">
            Hoạt động
          </Button>
        </div>

        {/* === PHẦN CÔNG CỤ PHỤ === */}
        <div className="chatter-tools">
          <InputGroup size="sm" style={{ maxWidth: "150px" }}>
            <InputGroup.Text>
              <FaSearch />
            </InputGroup.Text>
            <FormControl
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
          <Button
            variant="link"
            className="text-decoration-none text-secondary p-1"
            onClick={() => fileInputRef.current.click()}>
            <FaPaperclip />
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
          <Followers followerIds={task.message_follower_ids} />
          <FollowButton
            taskId={task.id}
            followerIds={task.message_follower_ids}
            onFollowersChange={onUpdate}
          />
        </div>
      </div>

      {/* === PHẦN BỊ THIẾU: HIỂN THỊ DANH SÁCH TIN NHẮN === */}
      <div className="chatter-feed">
        {loading && (
          <div className="text-center p-3">
            <Spinner size="sm" />
          </div>
        )}
        {error && (
          <Alert variant="danger" className="m-2">
            {error}
          </Alert>
        )}
        {!loading && filteredMessages.length === 0 && (
          <p className="text-muted text-center p-3">
            {searchTerm
              ? "Không tìm thấy tin nhắn phù hợp."
              : "Chưa có trao đổi nào."}
          </p>
        )}
        {filteredMessages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
      </div>
    </div>
  );
};

export default Chatter;
