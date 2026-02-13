
const pushNotification =  (io, userId, payload) => {
  io.to(userId).emit("notification", payload);
console.log("Assigned to" + userId + "" + payload)
};

module.exports = { pushNotification };
