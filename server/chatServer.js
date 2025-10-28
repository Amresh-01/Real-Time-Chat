import http from "http";
import { Server } from "socket.io";

const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log(`✅ User connected: ${socket.id}`);

  // Join a room
  socket.on("join_room", (roomId) => {
    socket.join(roomId);
    console.log(`➡️ ${socket.id} joined room ${roomId}`);
    io.to(roomId).emit("user_joined", { message: `User ${socket.id} joined!` });
  });

  // Handle message sending
  socket.on("send_message", ({ roomId, message }) => {
    console.log(`💬 ${socket.id}: ${message}`);
    io.to(roomId).emit("receive_message", {
      sender: socket.id,
      message,
    });
  });

  socket.on("disconnect", () => {
    console.log(`❌ User disconnected: ${socket.id}`);
  });
});

server.listen(8080, () => {
  console.log("🚀 Socket.IO test server running at http://localhost:8080");
});
