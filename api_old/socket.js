const { Server } = require("socket.io");

const users = {};
const groups = [];

module.exports = (req, res) => {
  if (!res.socket.server.io) {
    const io = new Server(res.socket.server, {
      path: "/api/socket",
      cors: { origin: "*" }
    });

    io.on("connection", (socket) => {
      
      socket.on("register", (data) => {
        users[socket.id] = {
          username: data.username || "User",
          email: data.email || ""
        };
        socket.emit("registered", users[socket.id]);
      });

      socket.on("login", (data) => {
        socket.emit("loginSuccess", {
          username: data.email || "User",
          email: data.email || ""
        });
      });

      socket.on("createGroup", (data) => {
        const group = {
          id: Date.now().toString(),
          name: data.name,
          type: data.type || "group",
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
        const group = groups.find(g => g.id === groupId);
        if (group) {
          socket.emit("groupMessages", group.messages);
        }
      });

      socket.on("groupMessage", (data) => {
        const user = users[socket.id] || { username: "User" };
        const msg = {
          id: Date.now().toString(),
          text: data.text,
          username: user.username,
          time: new Date().toLocaleTimeString("ru-RU", {
            hour: "2-digit",
            minute: "2-digit"
          })
        };
        
        const group = groups.find(g => g.id === data.groupId);
        if (group) {
          group.messages.push(msg);
        }
        
        io.to(data.groupId).emit("newGroupMessage", msg);
      });

      socket.on("disconnect", () => {
        delete users[socket.id];
      });

    });

    res.socket.server.io = io;
  }
  res.end();
};
