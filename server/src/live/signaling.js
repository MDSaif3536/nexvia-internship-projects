export function attachSignaling(io) {
  io.on("connection", (socket) => {
    socket.on("live:join", ({ roomId, user }) => {
      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.user = user;
      socket.to(roomId).emit("live:peer-joined", { socketId: socket.id, user });
      const peers = [...(io.sockets.adapter.rooms.get(roomId) || [])].filter((id) => id !== socket.id);
      socket.emit("live:peers", { peers });
    });

    socket.on("live:signal", ({ to, data }) => {
      io.to(to).emit("live:signal", { from: socket.id, data, user: socket.data.user });
    });

    socket.on("live:chat", ({ roomId, message }) => {
      io.to(roomId).emit("live:chat", {
        id: `${Date.now()}-${socket.id}`,
        from: socket.data.user,
        message,
        at: new Date().toISOString()
      });
    });

    socket.on("disconnect", () => {
      if (socket.data.roomId) {
        socket.to(socket.data.roomId).emit("live:peer-left", { socketId: socket.id });
      }
    });
  });
}
