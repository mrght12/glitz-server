const { Server } = require("socket.io");

const users = new Map();

module.exports = (req, res) => {
  if (!res.socket.server.io) {
    console.log("🚀 Glitz сервер запущен");
    
    const io = new Server(res.socket.server, {
      path: "/api/socket",
      cors: { origin: "*" }
    });

    io.on("connection", (socket) => {
      console.log("✅ Подключился:", socket.id);

      socket.on("join", (username) => {
        users.set(socket.id, username);
        io.emit("notification", {
          text: `${username} вошёл в чат`,
          time: getTime()
        });
      });

      socket.on("sendMessage", (text) => {
        const username = users.get(socket.id) || "Гость";
        io.emit("newMessage", {
          id: Date.now().toString(),
          text: text,
          username: username,
          senderId: socket.id,
          time: getTime()
        });
      });

      socket.on("disconnect", () => {
        const username = users.get(socket.id);
        if (username) {
          io.emit("notification", {
            text: `${username} вышел`,
            time: getTime()
          });
        }
        users.delete(socket.id);
      });
    });

    res.socket.server.io = io;
  }
  
  res.end();
};

function getTime() {
  return new Date().toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit"
  });
}