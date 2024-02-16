import { createServer } from "http";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { handleWebSocketConnections } from "./server.js";

dotenv.config({ path: "./.env" });

const app = express();
const server = createServer(app);

// Handle WebSocket connections
handleWebSocketConnections(server);


app.use(cors());
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.status(200).json({ message: "Hello Worldx,d" });
});



const PORT = process.env.PORT;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is listening on port ${PORT}`);
});
