import { getToken, getUsername } from "./auth.js";
import { currentRoomId, setCurrentRoomId } from "./rooms.js";

export let socket;

export function initSocket() {
  const token = getToken();

  if (!token) {
    alert("Please login first.");
    window.location.href = "index.html";
    return;
  }

  // ✅ Connect to your backend (adjust URL if using deployed server)
  socket = io("http://localhost:8080", {
    auth: { token },
    transports: ["websocket"],
  });

  socket.on("connect", () => {
    console.log("✅ Socket connected:", socket.id);
  });

  socket.on("connect_error", (err) => {
    console.error("❌ Socket connection error:", err.message);
    if (err.message.toLowerCase().includes("token")) {
      alert("Session expired. Please login again.");
      sessionStorage.clear();
      window.location.href = "index.html";
    }
  });

  // ✅ When message received from backend
  socket.on("receive_message", (data) => {
    // `data` should match backend emit: { roomId, sender, message }
    if (data.roomId !== currentRoomId) return; // Ignore if user not in that room
    addMessage(data.sender.username, data.message);
  });

  // ✅ System messages (user joined/left)
  socket.on("system_message", (msg) => {
    const messagesUL = document.getElementById("messages");
    const li = document.createElement("li");
    li.textContent = msg;
    li.classList.add("system-message");
    messagesUL.appendChild(li);
    messagesUL.scrollTop = messagesUL.scrollHeight;
  });
}

// ✅ Join a chat room
export function joinRoom(roomId) {
  if (!socket) return alert("Socket not connected yet");
  if (!roomId) return alert("Room ID is missing");

  if (currentRoomId) {
    socket.emit("leave_room", currentRoomId);
  }

  setCurrentRoomId(roomId);
  socket.emit("join_room", roomId);
  console.log("📌 Joined room:", roomId);
}

// ✅ Send a message to backend
export function sendMessage() {
  const msgInput = document.getElementById("msg");
  const msg = msgInput.value.trim();

  if (!msg) return alert("Please type a message");
  if (!currentRoomId) return alert("Please join a room first");
  if (!socket) return alert("Socket not connected");

  socket.emit("send_message", {
    roomId: currentRoomId,
    message: msg,
  });

  // Add your own message immediately in the UI
  addMessage(getUsername(), msg);
  msgInput.value = "";
}

// ✅ Display message in chat list
export function addMessage(sender, content) {
  const li = document.createElement("li");
  li.textContent = `${sender}: ${content}`;
  document.getElementById("messages").appendChild(li);

  // Auto-scroll
  const messagesUL = document.getElementById("messages");
  messagesUL.scrollTop = messagesUL.scrollHeight;
}

// ✅ Expose globally for HTML button onclicks
window.sendMessage = sendMessage;
window.joinRoom = joinRoom;
