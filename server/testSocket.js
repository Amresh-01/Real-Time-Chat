import { io } from "socket.io-client";

const ROOM_ID = "dummyRoom1";

const socket = io("http://localhost:8080", {
  transports: ["websocket"],
});

socket.on("connect", () => {
  console.log("✅ Connected to server:", socket.id);
  socket.emit("join_room", ROOM_ID);
});

socket.on("user_joined", (data) => {
  console.log("👋", data.message);
});

socket.on("receive_message", (msg) => {
  console.log("💬 Message received:", msg);
});

setTimeout(() => {
  console.log("📤 Sending message...");
  socket.emit("send_message", {
    roomId: ROOM_ID,
    message: "Hello from test client!",
  });
}, 2000);

socket.on("disconnect", () => {
  console.log("❌ Disconnected from server");
});
