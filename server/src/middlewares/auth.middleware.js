import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import dotenv from "dotenv";

dotenv.config();

export const protect = async (req, res, next) => {
  const authHeader = req.header("Authorization");

  // Check if Authorization header starts with Bearer
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, msg: "No Token Provided." });
  }

  const token = authHeader.split(" ")[1];
  console.log("Token....", token);
  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    console.log("decoded token ...", decoded);
    console.log("Current timestamp:", Math.floor(Date.now() / 1000));

    const user = await User.findById(decoded.sub).select("-password");

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User not found." });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ message: "Token has expired. Please login again." });
    }
    res.status(401).json({ message: "Invalid token." });
  }
};
