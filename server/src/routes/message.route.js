import { Router } from "express";
import { getMessagesByRoom } from "../controller/message.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/messages/:roomId", protect, getMessagesByRoom);

export default router;
