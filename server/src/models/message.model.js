import mongoose from "mongoose";
import Room from "./room.model.js";

const MessageSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Room",
    },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", MessageSchema);
export default Message;
