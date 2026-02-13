const { Server } = require("socket.io")
const app = require("../config/app")
const http = require("http")
let io;

function globalServer() {
  const server = http.createServer(app);

  io = new Server(server, {
    cors: { origin: ["http://localhost:3000", "https://landlordship-auth.vercel.app"] },
  });

  return { io, server };
}

const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};

module.exports = { globalServer, getIO };
