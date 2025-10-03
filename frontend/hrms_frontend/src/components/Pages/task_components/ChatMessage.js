// src/components/Pages/task_components/ChatMessage.js
import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Spinner } from "react-bootstrap";
import { FaPaperclip } from "react-icons/fa";
// THÊM MỚI: Import 2 hàm API cần thiết
import {
  fetchAttachmentDetails,
  fetchUserByPartnerId,
} from "../../../services/api";
import Avatar from "../../shared/Avatar";

const ChatMessage = ({ message }) => {
  const [attachments, setAttachments] = useState([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  // THÊM MỚI: State để lưu thông tin chi tiết của tác giả (bao gồm avatar)
  const [authorInfo, setAuthorInfo] = useState(null);

  const isNote = message.subtype_id && message.subtype_id[1] === "Ghi chú";
  const authorName = message.author_id ? message.author_id[1] : "Hệ thống";
  const authorPartnerId = message.author_id ? message.author_id[0] : null;

  const formattedDate = format(new Date(message.date), "dd/MM/yyyy HH:mm");

  // useEffect này giữ nguyên để tải file đính kèm
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

  // THÊM MỚI: useEffect thứ hai để tải thông tin avatar của tác giả
  useEffect(() => {
    const loadAuthorInfo = async () => {
      if (authorPartnerId) {
        try {
          // Gọi API để lấy user details từ partner ID
          const userDetails = await fetchUserByPartnerId(authorPartnerId);
          setAuthorInfo(userDetails); // Lưu vào state
        } catch (error) {
          console.error("Failed to fetch author info:", error);
        }
      } else {
        // Nếu không có author, reset state
        setAuthorInfo(null);
      }
    };

    loadAuthorInfo();
  }, [authorPartnerId]); // Chạy lại mỗi khi partner ID của tác giả thay đổi

  // THÊM MỚI: Xây dựng chuỗi src cho Avatar từ state authorInfo
  const avatarSrc = authorInfo?.image_128
    ? `data:image/jpeg;base64,${authorInfo.image_128}`
    : null;

  return (
    <div className={`chatter-message d-flex ${isNote ? "is-note" : ""}`}>
      <div className="message-sidebar">
        {/* SỬA ĐỔI: Dùng `src` thay vì `partnerId` */}
        <Avatar
          src={avatarSrc}
          altText={authorName}
          className="message-avatar me-2"
          size={45}
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
