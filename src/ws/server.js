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
    server: httpServer,
    path: "/ws",
    maxPayloadLength: 1024 * 1024,
  });

  wss.on("connection", async (socket, request) => {

    if(wsArcjet ) {
      try{
        const decision = await wsArcjet.protect(request);
        if(decision.isDenied()) {
          const code = decision.reason.isRateLimit() ? 1013 : 1008;
          const reason = decision.reason.isRateLimit() ? "Too many requests" : "Access denied";
          socket.close(code, reason);
          return;
        }
      }catch(error) {
        console.log("Arcjet Middleware error", error);
        socket.close(1011, "Internal Server Error");
        return;
      }
    }

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
