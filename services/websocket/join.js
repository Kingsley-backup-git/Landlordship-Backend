module.exports = (socket) => {
  socket.on("join", (userId) => {
    console.log("Joined" + userId)
    socket.join(userId);
  });
};
