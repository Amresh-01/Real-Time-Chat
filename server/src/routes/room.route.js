import Router from "express";
import { createRoom, getRooms } from "../controller/room.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/createRoom", protect, createRoom);
router.get("/getRooms", protect, getRooms);

export default router;
