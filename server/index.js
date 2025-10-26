import express from "express";
import dotenv from "dotenv";
import connectDB from "./src/db/db.connect.js";
import cors from "cors";
import authRoutes from "./src/routes/user.route.js";
import roomRoutes from "./src/routes/room.route.js";
import session from "express-session";

dotenv.config();

const app = express();
const PORT = 8080;

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
  res.send("Real Time chat backend is running...");
});

app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);

const startServer = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    app.listen(PORT, () => {
      console.log(`Server is running on Port http://localhost:${PORT}`);
    });
  } catch (error) {
    console.log("Server is not running...", error.message);
    process.exit(1);
  }
};

startServer();
