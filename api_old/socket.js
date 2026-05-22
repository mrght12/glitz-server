const { Server } = require("socket.io");

const users = {};
const groups = [];

module.exports = (req, res) => {
  if (!res.socket.server.io) {
    const io = new Server(res.socket.server, {
      path: "/api/socket",
      cors: { origin: "*" },
      transports: ["polling", "websocket"]
    });

    io.on("connection", (socket) => {
      
      socket.on("createGroup", (data) => {
        const group = {
          id: Date.now().toString(),
          name: data.name,
          messages: []
        };
        groups.push(group);
        io.emit("groupCreated", group);
      });

      socket.on("getGroups", () => {
        socket.emit("groupsList", groups);
      });

      socket.on("joinGroup", (groupId) => {
        socket.join(groupId);
      });

      socket.on("groupMessage", (data) => {
        const msg = {
          id: Date.now().toString(),
          text: data.text,
          username: "User",
          time: new Date().toLocaleTimeString("ru-RU", {
            hour: "2-digit",
            minute: "2-digit"
          })
        };
        io.to(data.groupId).emit("newGroupMessage", msg);
      });

    });

    res.socket.server.io = io;
  }
  res.end();
};
