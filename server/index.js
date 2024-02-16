// Import required modules
import { createServer } from "http"; // Use https if your server uses SSL
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Server } from "socket.io";

// Import function to handle WebSocket connections
import { handleWebSocketConnections } from "./server.js";

// Load environment variables from .env file
dotenv.config({ path: "./.env" });

// Create Express app
const app = express();

// Create HTTP servers using Express app
const messageServer = createServer(app);
const presenceServer = createServer(app);

// Create Socket.IO servers using HTTP servers
const messageIo = new Server(messageServer);
const presenceIo = new Server(presenceServer);

// Middleware setup
app.use(cors());
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Define your HTTP routes here
app.get("/", (req, res) => {
  res.status(200).json({ message: "Hello World" });
});

// Handle WebSocket connections using Socket.IO
messageIo.on("connection", (socket) => {
  console.log("A user connected to message server");

  // Handle WebSocket events here

  socket.on("disconnect", () => {
    console.log("User disconnected from message server");
  });
});

presenceIo.on("connection", (socket) => {
  console.log("A user connected to presence server");

  // Handle WebSocket events here

  socket.on("disconnect", () => {
    console.log("User disconnected from presence server");
  });
});

// Define the ports for your servers to listen on
const MESSAGE_PORT = process.env.PORTM || 3001;
const PRESENCE_PORT = process.env.PORTP || 3002;

// Start the servers and listen on the specified ports
messageServer.listen(MESSAGE_PORT, () => {
  console.log(`WebSocket server for messages is listening on port ${MESSAGE_PORT}`);
});

presenceServer.listen(PRESENCE_PORT, () => {
  console.log(`WebSocket server for presence is listening on port ${PRESENCE_PORT}`);
});
