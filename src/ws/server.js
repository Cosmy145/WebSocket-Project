import { WebSocketServer, WebSocket } from "ws";

function sendJson(socket, payload) {
  if (!socket.readyState === WebSocket.OPEN) {
    return;
  }
  socket.send(JSON.stringify(payload));
}

function broadcastJson(wss, payload) {
  wss.clients.forEach((client) => {
    if (client.readyState !== WebSocket.OPEN) {
      return;
    }
    sendJson(client, payload);
  });
}

export function attachWebsocketServer(httpServer) {
  const wss = new WebSocketServer({
    server: httpServer,
    path: "/ws",
    maxPayloadLength: 1024 * 1024,
  });

  wss.on("connection", (socket) => {
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

  function broadcastMatchCreated(match){
    broadcastJson(wss, {
      type: "match_created",
      match,
    });
  }

  return {broadcastMatchCreated};
}
