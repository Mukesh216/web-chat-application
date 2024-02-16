import { createServer } from "http";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Server } from "socket.io";

dotenv.config({ path: "./.env" });

const app = express();
const messageServer = createServer(app);
const presenceServer = createServer(app);
const messageIo = new Server(messageServer);
const presenceIo = new Server(presenceServer);

app.use(cors());
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.status(200).json({ message: "Hello World,d" });
});

// You won't see these console statements when testing with Postman
messageIo.on("connection", (socket) => {
  console.log("A user connected to message server");

  socket.on("disconnect", () => {
    console.log("User disconnected from message server");
  });
});

presenceIo.on("connection", (socket) => {
  console.log("A user connected to presence server");

  socket.on("disconnect", () => {
    console.log("User disconnected from presence server");
  });
});

const MESSAGE_PORT = process.env.PORTM 
const PRESENCE_PORT = process.env.PORTP  // Default to port 3002 if PORTP is not defined

messageServer.listen(MESSAGE_PORT, "0.0.0.0", () => {
  console.log(`WebSocket server for messages is listening on port ${MESSAGE_PORT}`);
});

presenceServer.listen(PRESENCE_PORT,"0.0.0.0", () => {
  console.log(`WebSocket server for presence.. is listening on port ${PRESENCE_PORT}`);
});
