import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import User from "../models/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";

dotenv.config();

const {
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  ACCESS_TOKEN_EXPIRES,
  REFRESH_TOKEN_EXPIRES,
  PASSWORD_RESET_TOKEN_EXP,
} = process.env;

// This will Generate JWT Access and Refresh Token
function signAccessToken(user) {
  return jwt.sign({ sub: user._id }, JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES || "1h",
  });
}

function signRefreshToken(user) {
  return jwt.sign({ sub: user._id }, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES || "7d",
  });
}

const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    throw new ApiError(400, "Missing required fields");
  }

  if (!/\S+@\S+\.\S+/.test(email)) {
    throw new ApiError(400, "Invalid email format");
  }

  if (
    !/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
      password
    )
  ) {
    throw new ApiError(
      400,
      "Password must be at least 8 characters long and include at least one letter, one number, and one special character (@, $, !, %, *, ?, &)."
    );
  }

  const exists = await User.findOne({ $or: [{ email }, { username }] });
  if (exists) {
    throw new ApiError(409, "User with given email or username already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ username, email, password: hashedPassword });
  await user.save();

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { id: user._id, username: user.username, email: user.email },
        "User registered successfully"
      )
    );
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!/\S+@\S+\.\S+/.test(email)) {
    throw new ApiError(400, "Invalid email format");
  }

  if (
    !/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
      password
    )
  ) {
    throw new ApiError(
      400,
      "Password must be at least 8 characters long and include at least one letter, one number, and one special character (@, $, !, %, *, ?, &)."
    );
  }

  let user = await User.findOne({ email }).select("-refreshToken");
  if (!user) {
    throw new ApiError(401, "Invalid email");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new ApiError(401, "Invalid password");
  }

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  user.refreshToken = refreshToken;
  await user.save();

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  };

  return res
    .status(200)
    .cookie("refreshToken", refreshToken, cookieOptions) // Yeh line user ke browser me ek secure cookie set karti hai jisme refresh token store hota hai.
    .json(
      new ApiResponse(200, { accessToken, refreshToken }, "Login successful")
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  const UserId = req.user?.id;
  if (!UserId) {
    throw new ApiError(401, "User is not authenticated");
  }

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  };

  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, null, "Logout successful"));
});

const getcurrentUser = asyncHandler(async (req, res) => {
  const UserId = req.user?.id;

  if (!UserId) {
    throw new ApiError(401, "User is not authenticated");
  }

  const user = await User.findById(UserId).select("-refreshToken");
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { id: user._id, username: user.username, email: user.email },
        "Current user retrieved successfully"
      )
    );
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const UserId = req.user?.id;
  const { oldPassword, newPassword, confirmPassword } = req.body;

  if (!UserId) {
    throw new ApiError(401, "User is not authenticated");
  }

  const user = await User.findById(UserId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!newPassword || !oldPassword || !confirmPassword) {
    throw new ApiError(400, "All fields are required");
  }

  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) {
    throw new ApiError(401, "Old password is incorrect");
  }

  if (
    !/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
      newPassword
    )
  ) {
    throw new ApiError(
      400,
      "Password must be at least 8 characters long and include at least one letter, one number, and one special character (@, $, !, %, *, ?, &)."
    );
  }

  if (newPassword != confirmPassword) {
    throw new ApiError(400, "the newPassword is Not matching.");
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Password changed successfully"));
});

const updateUserProfile = asyncHandler(async (req, res) => {
  const UserId = req.user?.id;
  const { newUsername, newEmail } = req.body;

  if (!UserId) {
    throw new ApiError("User not found");
  }

  if (!newUsername && !newEmail) {
    throw new ApiError(400, "No data provided for update");
  }

  const updateUser = await User.findByIdAndUpdate(
    UserId,
    {
      ...(newUsername && { username: newUsername }),
      ...(newEmail && { email: newEmail }),
    },
    { new: true, runValidators: true }
  ).select("-password -refreshToken");

  if (!updateUser) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updateUser, "Profile updated Successfully"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  getcurrentUser,
  changeCurrentPassword,
  updateUserProfile,
};
