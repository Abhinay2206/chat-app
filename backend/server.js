const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const connectDB = require("./utils/db");
const authRoutes = require("./routes/auth");
const messageRoutes = require("./routes/messages");
const detailRoutes = require("./routes/details");
const Message = require("./models/Message");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const loggedInUsers = new Map();

connectDB();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api", detailRoutes);

io.on("connection", (socket) => {
  console.log("New client connected");

  socket.on("join", ({ userId }) => {
    loggedInUsers.set(userId, socket.id);
    io.emit("updateUserList", Array.from(loggedInUsers.keys()));
  });

  socket.on("sendMessage", async ({ sender, receiver, content }) => {
    try {
      const message = await Message.create({ sender, receiver, content });
      io.to(loggedInUsers.get(receiver)).emit("receiveMessage", message);
      io.to(loggedInUsers.get(sender)).emit("messageSent", message);
    } catch (err) {
      console.error(err);
    }
  });

  socket.on("disconnect", () => {
    loggedInUsers.forEach((value, key) => {
      if (value === socket.id) {
        loggedInUsers.delete(key);
      }
    });
    io.emit("updateUserList", Array.from(loggedInUsers.keys()));
    console.log("Client disconnected");
  });
});

server.listen(5000, () => {
  console.log("Server is running on port 5000");
});
