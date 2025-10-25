import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGO_URI);
    console.log("MogoDB is connected....");
  } catch (error) {
    console.log("MogoDB is not connected....");
    process.exit(1);
  }
};

export default connectDB;
