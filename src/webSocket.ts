import { type Socket, Server as SIOServer } from "socket.io";
import { type Server as HTTPServer } from "http";
import jwt from "jsonwebtoken";
import Student from "./model/Student";
import Teacher from "./model/Teacher";
import UserDocument from "./model/User";

export default function setupWebSocket(server: HTTPServer) {
  const application = new SIOServer(server, {
    cors: {
      origin: "*",
      credentials: true,
    },
  });

  application.on("connection", async (socket: Socket) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      socket.disconnect(true);
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        id: string;
      };

      let user: UserDocument | null =
        (await Student.findById(decoded.id)) ??
        (await Teacher.findById(decoded.id));

      if (!user) {
        socket.disconnect(true);
        return;
      }

      user.online = true;
      user.lastSeen = new Date();
      await user.save();

      socket.on("disconnect", async () => {
        const disconnectedUser =
          (await Student.findById(decoded.id)) ??
          (await Teacher.findById(decoded.id));

        if (disconnectedUser) {
          disconnectedUser.online = false;
          disconnectedUser.lastSeen = new Date();
          await disconnectedUser.save();
        }
      });
    } catch (err) {
      console.error("JWT verification failed in socket:", err);
      socket.disconnect(true);
    }
  });
}
