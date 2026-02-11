import express from "express";
import matchesRoutes from "./routes/matches.routes.js";
import http from "http";
import { attachWebsocketServer } from "./ws/server.js";
import { securityMiddleware } from "./config/arcjet.js";
  
const PORT = process.env.PORT || 8000;
const HOST = process.env.HOST || "localhost";

const app = express();
const server = http.createServer(app);

// JSON middleware
app.use(express.json());

// Root GET route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to the Express.js server!" });
});

app.use(securityMiddleware());

app.use("/api/v1/matches", matchesRoutes);

attachWebsocketServer(server);

// Start server
server.listen(PORT, HOST, () => {
  const baseUrl =
    HOST === "0.0.0.0" ? `http://localhost:${PORT}` : `http://${HOST}:${PORT}`;
  console.log(`Server is running at ${baseUrl}`);
  console.log(
    `WebSocket server is running at ${baseUrl.replace("http", "ws")}/ws`,
  );
});
