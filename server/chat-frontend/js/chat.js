import { sendMessage } from "./socket.js";
import { createRoom, initChatPage } from "./rooms.js";
import { getToken } from "./auth.js";

document.addEventListener("DOMContentLoaded", async () => {
  const token = getToken();

  if (!token) {
    alert("Please login to access chat");
    window.location.href = "index.html";
    return;
  }

  await initChatPage();

  const createRoomBtn = document.getElementById("createRoomBtn");
  if (createRoomBtn) {
    createRoomBtn.addEventListener("click", createRoom);
  }

  const sendBtn = document.getElementById("sendBtn");
  if (sendBtn) {
    sendBtn.addEventListener("click", sendMessage);
  }

  const msgInput = document.getElementById("msg");
  if (msgInput) {
    msgInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        sendMessage();
      }
    });
  }

  console.log("Chat page initialized successfully");
});
