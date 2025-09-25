// src/components/Pages/task_components/ChatMessage.js
import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Spinner } from "react-bootstrap";
import { FaPaperclip } from "react-icons/fa";
// SỬA LẠI: Import thêm fetchBase64Image
import {
  fetchAttachmentDetails,
  fetchBase64Image,
} from "../../../services/api";
import defaultAvatar from "../../../assets/images/default-avatar.png";

const ChatMessage = ({ message }) => {
  const [attachments, setAttachments] = useState([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [avatarSrc, setAvatarSrc] = useState(defaultAvatar); // State để lưu trữ ảnh an toàn

  const isNote = message.subtype_id && message.subtype_id[1] === "Ghi chú";
  const authorName = message.author_id ? message.author_id[1] : "Hệ thống";
  const authorPartnerId = message.author_id ? message.author_id[0] : null;

  // Dùng useEffect để lấy ảnh avatar một cách an toàn
  useEffect(() => {
    const loadAvatar = async () => {
      if (authorPartnerId) {
        // Dùng tên trường avatar_128 để có ảnh nhỏ, tối ưu hơn
        const imageUrl = `/web/image/res.partner/${authorPartnerId}/avatar_128`;
        const imageData = await fetchBase64Image(imageUrl);
        // Chỉ cập nhật nếu tải thành công, nếu không vẫn giữ ảnh mặc định
        if (imageData) {
          setAvatarSrc(imageData);
        }
      } else {
        setAvatarSrc(defaultAvatar);
      }
    };
    loadAvatar();
  }, [authorPartnerId]);

  const formattedDate = format(new Date(message.date), "dd/MM/yyyy HH:mm");

  useEffect(() => {
    const loadAttachments = async () => {
      if (message.attachment_ids && message.attachment_ids.length > 0) {
        setLoadingAttachments(true);
        try {
          const data = await fetchAttachmentDetails(message.attachment_ids);
          setAttachments(data);
        } catch (error) {
          console.error("Failed to load attachments", error);
        } finally {
          setLoadingAttachments(false);
        }
      }
    };
    loadAttachments();
  }, [message.attachment_ids]);

  return (
    <div className={`chatter-message d-flex ${isNote ? "is-note" : ""}`}>
      <div className="message-sidebar">
        {/* Dùng state avatarSrc để đảm bảo ảnh luôn hiển thị */}
        <img src={avatarSrc} alt={authorName} className="message-avatar" />
      </div>
      <div className="message-core">
        <div className="message-header">
          <strong>{authorName}</strong>
          <span className="message-date text-muted">{formattedDate}</span>
        </div>
        <div
          className="message-body"
          dangerouslySetInnerHTML={{ __html: message.body }}
        />
        {loadingAttachments && <Spinner size="sm" />}
        {attachments.length > 0 && (
          <div className="message-attachments">
            <strong>Tệp đính kèm:</strong>
            <ul>
              {attachments.map((att) => (
                <li key={att.id}>
                  <FaPaperclip className="me-1" />
                  <a
                    href={`${process.env.REACT_APP_ODOO_BASE_URL}/web/content/${att.id}?download=true`}
                    target="_blank"
                    rel="noopener noreferrer">
                    {att.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(ChatMessage);
