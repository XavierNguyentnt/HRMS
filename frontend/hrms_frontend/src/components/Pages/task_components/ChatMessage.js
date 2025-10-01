// src/components/Pages/task_components/ChatMessage.js
import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Spinner } from "react-bootstrap";
import { FaPaperclip } from "react-icons/fa";
// SỬA LẠI: Import thêm fetchBase64Image
import { fetchAttachmentDetails } from "../../../services/api";
import Avatar from "../../shared/Avatar";

const ChatMessage = ({ message }) => {
  const [attachments, setAttachments] = useState([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const isNote = message.subtype_id && message.subtype_id[1] === "Ghi chú";
  const authorName = message.author_id ? message.author_id[1] : "Hệ thống";
  const authorPartnerId = message.author_id ? message.author_id[0] : null; // Chúng ta vẫn cần partnerId

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
        {/* BƯỚC 3: THAY THẾ THẺ <img> BẰNG COMPONENT <Avatar /> */}
        <Avatar
          partnerId={authorPartnerId}
          altText={authorName}
          className="message-avatar me-2" // Truyền class cũ vào để giữ style
          size={45} // Kích thước avatar mong muốn
        />
      </div>
      <div className="message-core">
        <div className="message-header">
          <strong>{authorName}</strong>
          <span className="message-date text-muted ms-2">{formattedDate}</span>
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
