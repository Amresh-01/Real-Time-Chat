import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/userModel.js";
import Message from "../models/messageModel.js";
import chatRoom from "../models/chatRoomModel.js";

export const chatSocket = (io) => {
  io.on("connection", async (socket) => {
    console.log("New Client Connected:", socket.id);

    const token = socket.handshake.auth?.token;

    if (!token) {
      console.log("No token provided, disconnecting...");
      socket.disconnect(true);
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      console.log(`User authenticated: ${socket.userId}`);
    } catch (err) {
      console.log("Invalid token");
      socket.disconnect(true);
      return;
    }

    socket.on("join_room", async (roomId) => {
      if (!roomId || !mongoose.Types.ObjectId.isValid(roomId)) {
        return socket.emit("error", { message: "Invalid room ID" });
      }

      const roomExists = await chatRoom.findById(roomId);
      if (!roomExists) {
        return socket.emit("error", { message: "Room does not exist" });
      }

      socket.join(roomId);

      const user = await User.findById(socket.userId).select("username email");

      console.log(`User ${socket.userId} joined room ${roomId}`);
      socket.to(roomId).emit("user_joined", {
        userId: user._id,
        username: user.username,
        message: `${user.username} joined the room`,
      });

      io.to(roomId).emit("system_message", `${user.username} joined the room.`);
    });

    socket.on("send_message", async ({ roomId, content }) => {
      if (!roomId || !mongoose.Types.ObjectId.isValid(roomId)) {
        return socket.emit("error", { message: "Invalid room ID" });
      }
      if (!content?.trim()) return;

      const roomExists = await chatRoom.findById(roomId);
      if (!roomExists) {
        return socket.emit("error", { message: "Room does not exist" });
      }

      try {
        const message = new Message({
          room: roomId,
          sender: socket.userId,
          content: content.trim(),
        });

        const savedMessage = await message.save();
        const populatedMessage = await savedMessage.populate(
          "sender",
          "username email"
        );

        io.to(roomId).emit("receive_message", populatedMessage);

        console.log(`User ${socket.userId} sent a message in ${roomId}`);
      } catch (err) {
        console.error("Error saving message:", err);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // Leave Room
    socket.on("leave_room", async (roomId) => {
      if (!roomId || !mongoose.Types.ObjectId.isValid(roomId)) return;

      socket.leave(roomId);
      const user = await User.findById(socket.userId).select("username email");
      console.log(`User ${socket.userId} left room ${roomId}`);

      socket.to(roomId).emit("user_left", {
        userId: user._id,
        username: user.username,
        message: `${user.username} left the room`,
      });

      io.to(roomId).emit("system_message", `${user.username} left the room.`);
    });

    // Disconnect
    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });
};
