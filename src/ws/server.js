import { WebSocketServer, WebSocket } from "ws";
import matchEmitter from "../events/matchEvents.js";
import { wsArcjet } from "../config/arcjet.js";

function sendJson(socket, payload) {
  if (socket.readyState !== WebSocket.OPEN) {
    return;
  }
  socket.send(JSON.stringify(payload));
}

function broadcastJson(wss, payload) {
  wss.clients.forEach((client) => {
    sendJson(client, payload);
  });
}

export function attachWebsocketServer(httpServer) {
  const wss = new WebSocketServer({
    noServer: true,
    maxPayloadLength: 1024 * 1024,
  });

  httpServer.on("upgrade", async (request, socket, head) => {
    if (request.url !== "/ws") {
      socket.destroy();
      return;
    }

    if (wsArcjet) {
      try {
        const decision = await wsArcjet.protect(request);
        if (decision.isDenied()) {
          const message = decision.reason.isRateLimit()
            ? "HTTP/1.1 429 Too Many Requests\r\n\r\n"
            : "HTTP/1.1 403 Forbidden\r\n\r\n";
          socket.write(message);
          socket.destroy();
          return;
        }
      } catch (error) {
        console.log("Arcjet Middleware error", error);
        socket.write("HTTP/1.1 500 Internal Server Error\r\n\r\n");
        socket.destroy();
        return;
      }
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  });

  wss.on("connection", (socket) => {
    socket.isAlive = true;
    socket.on("pong", () => {
      socket.isAlive = true;
    });
    sendJson(socket, {
      type: "welcome",
      message: "Welcome to the WebSocket server",
    });
    socket.on("close", () => {
      console.log("Client disconnected");
    });
    socket.on("error", (error) => {
      console.log("Client error", error);
    });
  });

  const interval = setInterval(() => {
    wss.clients.forEach((client) => {
      if (client.isAlive) {
        client.isAlive = false;
        client.ping();
      } else {
        client.terminate();
      }
    });
  }, 10000);

  wss.on("close", () => {
    clearInterval(interval);
  });

  // Listen for match events and broadcast to all WebSocket clients
  matchEmitter.on("match:created", (match) => {
    broadcastJson(wss, {
      type: "match_created",
      match,
    });
  });
}
