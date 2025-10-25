import { Router } from "express";
import express from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  getcurrentUser,
  changeCurrentPassword,
  updateUserProfile,
} from "../controller/user.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

router.post("/logout", protect, logoutUser);
router.get("/getCurrentUser", protect, getcurrentUser);
router.patch("/updateProfile", protect, updateUserProfile);
router.patch("/changePassword", protect, changeCurrentPassword);

export default router;
