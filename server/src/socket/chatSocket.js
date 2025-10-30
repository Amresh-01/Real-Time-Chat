import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { saveMessage } from "../controller/message.controller.js";
import User from "../models/user.model.js";
import Room from "../models/room.model.js";

dotenv.config();

export const ChatSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: ["http://localhost:5173"], // ✅ frontend origin
      credentials: true,
    },
  });

  // ✅ Authentication middleware for sockets
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token; // safer
      if (!token) return next(new Error("Authentication token missing"));

      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      const user = await User.findById(decoded.sub).select("-password");
      if (!user) return next(new Error("User not found"));

      socket.user = user;
      next();
    } catch (err) {
      console.error("❌ Socket auth error:", err.message);
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.user.username}`);

    socket.on("join_room", async (roomId) => {
      try {
        const room = await Room.findById(roomId);
        if (!room) {
          socket.emit("system_message", "Room not found");
          return;
        }

        socket.join(roomId);
        socket.currentRoom = roomId;

        // Add user to room if not already a member
        if (!room.members.includes(socket.user._id)) {
          room.members.push(socket.user._id);
          await room.save();
        }

        io.to(roomId).emit("user_joined", {
          message: `${socket.user.username} joined the room.`,
        });

        console.log(`➡️ ${socket.user.username} joined room ${roomId}`);
      } catch (error) {
        console.error("Join room error:", error.message);
        socket.emit("system_message", "Error joining room");
      }
    });

    // ✅ Send Message
    socket.on("send_message", async ({ roomId, message }) => {
      try {
        if (!roomId || !message.trim()) return;

        const savedMessage = await saveMessage(
          roomId,
          socket.user._id,
          message.trim()
        );

        io.to(roomId).emit("receive_message", savedMessage);
        console.log(`💬 ${socket.user.username}: ${message}`);
      } catch (error) {
        console.error("Message send error:", error.message);
        socket.emit("system_message", "Failed to send message");
      }
    });

    // ✅ Leave Room
    socket.on("leave_room", (roomId) => {
      socket.leave(roomId);
      io.to(roomId).emit("user_left", {
        message: `${socket.user.username} left the room.`,
      });
      console.log(`↩️ ${socket.user.username} left room ${roomId}`);
    });

    // ✅ Disconnect
    socket.on("disconnect", () => {
      console.log(`❌ User disconnected: ${socket.user.username}`);
    });
  });

  return io;
};
