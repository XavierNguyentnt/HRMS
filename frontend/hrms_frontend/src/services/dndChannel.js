// src/services/dndChannel.js

// Tạo một kênh với tên duy nhất cho toàn bộ ứng dụng
const channel = new BroadcastChannel("kdpd_dms_dnd");

export const broadcastDragStart = (items) => {
  channel.postMessage({ type: "DRAG_START", payload: { items } });
};

export const broadcastDragEnd = () => {
  channel.postMessage({ type: "DRAG_END" });
};

// Hàm để các component có thể lắng nghe tin nhắn
export const listenForDndMessages = (callback) => {
  const handler = (event) => {
    callback(event.data);
  };
  channel.addEventListener("message", handler);

  // Trả về một hàm để cleanup
  return () => {
    channel.removeEventListener("message", handler);
  };
};
