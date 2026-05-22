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
      
      // Регистрация
      socket.on("register", (data) => {
        users[socket.id] = {
          username: data.username || "User",
          email: data.email || "",
          avatar: ""
        };
        socket.emit("registered", users[socket.id]);
      });

      // Вход
      socket.on("login", (data) => {
        socket.emit("loginSuccess", {
          username: data.email || "User",
          email: data.email || ""
        });
      });

      // Создание группы
      socket.on("createGroup", (data) => {
        const group = {
          id: Date.now().toString(),
          name: data.name,
          type: data.type,
          messages: []
        };
        groups.push(group);
        io.emit("groupCreated", group);
      });

      // Получить список групп
      socket.on("getGroups", () => {
        socket.emit("groupsList", groups);
      });

      // Присоединиться к группе
      socket.on("joinGroup", (groupId) => {
        socket.join(groupId);
        const group = groups.find(g => g.id === groupId);
        if (group) {
          socket.emit("groupMessages", group.messages);
        }
      });

      // Отправить сообщение в группу
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

    });

    res.socket.server.io = io;
  }
  res.end();
};
