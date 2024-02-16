// server/index.js or server/index.mjs
import { createServer } from "http";
// import { WebSocketServer as Server } from "ws";
import express from "express";
import cors from "cors";
import path from "path";
//dotenv
import dotenv from "dotenv";
dotenv.config(
  {path:"./.env"}
);  
import { handleWebSocketConnections } from "./server.js";

const app = express();
const messageServer = createServer(app);
const presenceServer = createServer(app);


app.use(cors());



app.use(express.static("public"));


app.use(express.json());

app.use(express.urlencoded({ extended: true }));


app.get('/', (req, res) => {
  // Handle API request logic here
  res.status(200).json({ message: 'Hello World' });
});



handleWebSocketConnections(messageServer, presenceServer);

const MESSAGE_PORT = process.env.PORTM;
const PRESENCE_PORT = process.env.PORTP;


messageServer.listen(MESSAGE_PORT, "0.0.0.0", () => {
  console.log(`WebSocket server is listening on port ${MESSAGE_PORT}`);
});

presenceServer.listen(PRESENCE_PORT, "0.0.0.0", () => {
  console.log(`WebSocket server is listening : USER ENTRY  ${PRESENCE_PORT}`);
});








13.228.225.19
18.142.128.26
54.254.162.138