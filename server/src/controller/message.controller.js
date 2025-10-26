import dotenv from "dotenv";
import Message from "../models/message.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";

dotenv.config();

const getMessagesByRoom = asyncHandler(async (req, res) => {
  const { roomId } = req.params;

  if (!roomId) {
    throw new ApiError(400, "Room ID is required");
  }

  const messages = await Message.find({ roomId })
    .populate("sender")
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, messages, "Messages fetched successfully"));
});

const saveMessage = async (roomId, sender, message) => {
  const newMessage = await Message.create({ roomId, sender, message });
  await newMessage.populate("sender");
  return newMessage;
};

export { saveMessage, getMessagesByRoom };
