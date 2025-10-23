import mongoose from "mongoose";

const UserScema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true, // trailing spaces ko delete kar deta hai ex- "    Amresh   " -->   "Amresh"
      match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    },
    password: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", UserScema);

export default User;
