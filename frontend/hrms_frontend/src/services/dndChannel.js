// src/services/dndChannel.js
const channel = new BroadcastChannel("kdpd_dms_dnd");

export const broadcastDragStart = (items, action = "move", sourceWindowId) => {
  channel.postMessage({
    type: "DRAG_START",
    payload: { items, action, sourceWindowId },
  });
};

export const broadcastDragEnd = () => {
  channel.postMessage({ type: "DRAG_END" });
};

export const broadcastRefresh = () => {
  channel.postMessage({ type: "REFRESH" });
};

// Lắng nghe; trả về cleanup
export const listenForDndMessages = (callback) => {
  const handler = (event) => {
    callback(event.data);
  };
  channel.addEventListener("message", handler);
  return () => channel.removeEventListener("message", handler);
};
