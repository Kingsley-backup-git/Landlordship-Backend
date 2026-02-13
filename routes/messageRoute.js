const express = require("express");
const route = express.Router();
const requireAuth = require("../middleware/authMiddleware");
const { sendMessage, getMessages, markAsRead } = require("../controllers/messages");

route.post("/:chatId/send", requireAuth, sendMessage);
route.get("/:chatId", requireAuth, getMessages);
route.patch("/:chatId/read", requireAuth, markAsRead);

module.exports = route;