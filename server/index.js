import express from "express";
import dotenv from "dotenv";
import connectDB from "./src/db/db.connect.js";
import cors from "cors";
import authRoutes from "./src/routes/user.route.js";
import roomRoutes from "./src/routes/room.route.js";
import messageRoutes from "./src/routes/message.route.js";
import session from "express-session";
import http from "http";
import { Server } from "socket.io";
import { ChatSocket } from "./src/socket/chatSocket.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: "someSecretKey",
    resave: false,
    saveUninitialized: false,
  })
);

app.get("/", (req, res) => {
  res.send("Real Time Chat backend is running...");
});

app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/messages", messageRoutes);

const server = http.createServer(app);

const startServer = async () => {
  try {
    await connectDB(process.env.MONGO_URI);

    const io = new Server(server, {
      cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    ChatSocket(io);

    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Server failed to start:", error.message);
    process.exit(1);
  }
};

startServer();
