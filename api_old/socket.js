const { Server } = require("socket.io");

const users = new Map();

module.exports = (req, res) => {
  if (!res.socket.server.io) {
    const io = new Server(res.socket.server, {
      path: "/api/socket",
      cors: { origin: "*" }
    });

    io.on("connection", (socket) => {
      socket.on("join", (username) => {
        users.set(socket.id, username);
        io.emit("notification", {
          text: `${username} вошёл в чат`,
          time: new Date().toLocaleTimeString("ru-RU", {
            hour: "2-digit",
            minute: "2-digit"
          })
        });
      });

      socket.on("sendMessage", (text) => {
        const username = users.get(socket.id) || "Гость";
        io.emit("newMessage", {
          id: Date.now().toString(),
          text: text,
          username: username,
          senderId: socket.id,
          time: new Date().toLocaleTimeString("ru-RU", {
            hour: "2-digit",
            minute: "2-digit"
          })
        });
      });

      socket.on("disconnect", () => {
        users.delete(socket.id);
      });
    });

    res.socket.server.io = io;
  }
  res.end();
};
