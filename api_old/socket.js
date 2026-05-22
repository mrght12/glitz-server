const { Server } = require("socket.io");

const users = new Map(); // socketId -> {username, avatar}
const groups = new Map(); // groupId -> {name, type: 'group'/'channel', members: [], messages: []}

module.exports = (req, res) => {
  if (!res.socket.server.io) {
    const io = new Server(res.socket.server, {
      path: "/api/socket",
      cors: { origin: "*" }
    });

    io.on("connection", (socket) => {
      
      // Регистрация пользователя
      socket.on("register", (data) => {
        users.set(socket.id, {
          email: data.email,
          username: data.username,
          avatar: data.avatar || "",
          socketId: socket.id
        });
        socket.emit("registered", { userId: socket.id });
      });

      // Вход
      socket.on("login", (email) => {
        const user = Array.from(users.values()).find(u => u.email === email);
        if (user) {
          socket.emit("loginSuccess", user);
        } else {
          socket.emit("loginError", "Пользователь не найден");
        }
      });

      // Обновление профиля
      socket.on("updateProfile", (data) => {
        const user = users.get(socket.id);
        if (user) {
          user.username = data.username || user.username;
          user.avatar = data.avatar || user.avatar;
          users.set(socket.id, user);
          socket.emit("profileUpdated", user);
        }
      });

      // Создание группы/канала
      socket.on("createGroup", (data) => {
        const groupId = Date.now().toString();
        groups.set(groupId, {
          id: groupId,
          name: data.name,
          type: data.type, // 'group' или 'channel'
          creator: users.get(socket.id)?.username || "Admin",
          members: [socket.id],
          messages: [],
          avatar: data.avatar || ""
        });
        io.emit("groupCreated", groups.get(groupId));
      });

      // Присоединиться к группе
      socket.on("joinGroup", (groupId) => {
        socket.join(groupId);
        const group = groups.get(groupId);
        if (group && !group.members.includes(socket.id)) {
          group.members.push(socket.id);
        }
        socket.emit("groupMessages", group?.messages || []);
      });

      // Отправка в группу
      socket.on("groupMessage", (data) => {
        const user = users.get(socket.id);
        const msg = {
          id: Date.now().toString(),
          text: data.text,
          username: user?.username || "Аноним",
          avatar: user?.avatar || "",
          time: getTime(),
          groupId: data.groupId
        };
        
        const group = groups.get(data.groupId);
        if (group) {
          group.messages.push(msg);
        }
        
        io.to(data.groupId).emit("newGroupMessage", msg);
      });

      // Личное сообщение
      socket.on("privateMessage", (data) => {
        const user = users.get(socket.id);
        const msg = {
          id: Date.now().toString(),
          text: data.text,
          username: user?.username || "Аноним",
          avatar: user?.avatar || "",
          time: getTime(),
          senderId: socket.id
        };
        
        // Отправляем получателю
        io.to(data.to).emit("newPrivateMessage", msg);
        // И себе
        socket.emit("newPrivateMessage", { ...msg, isMine: true });
      });

      socket.on("disconnect", () => {
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
