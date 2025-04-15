import { Socket } from "socket.io";

const webSocket = require("socket.io")(3001, {
  cors: {
    origin: "http://localhost:5000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

webSocket.on("connection", (socket: Socket) => {
  console.log("A user connected: " + socket.id);
});

export default webSocket;
