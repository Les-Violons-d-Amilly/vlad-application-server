import type { Server } from "http";
import { type Socket, Server as SIOServer } from "socket.io";

export default function (app: Server) {
  const application = new SIOServer(app, {
    cors: {
      origin: "*",
      credentials: true,
    },
  });

  application.on("connection", (socket: Socket) => {
    console.log("New client connected", socket.id);

    socket.on("disconnect", () => {
      console.log("Client disconnected", socket.id);
    });
  });
}
