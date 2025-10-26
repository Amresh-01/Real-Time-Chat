import dotenv from "dotenv";
import Room from "../models/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";

dotenv.config();

const createRoom = asyncHandler(async (req, res) => {
  const { RoomName } = req.body;

  if (!RoomName) {
    throw new ApiError(400, "RoomName is required");
  }

  const existingRoom = await Room.findOne({ RoomName });
  if (existingRoom) {
    throw new ApiError(400, "Room with this name already exists");
  }

  const room = new Room({
    RoomName,
    members: [req.user._id],
  });
  await room.save();

  res
    .status(201)
    .json(new ApiResponse(true, "Room created successfully", room));
});

const getRooms = asyncHandler(async (req, res) => {
  const rooms = await Room.find().populate(
    "members",
    "-password",
    "username email"
  );
  res
    .status(200)
    .json(new ApiResponse(true, "Rooms fetched successfully", rooms));
});

export { createRoom, getRooms };
