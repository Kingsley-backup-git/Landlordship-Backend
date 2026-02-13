const express = require("express");
const route = express.Router();
const requireAuth = require("../middleware/authMiddleware");
const { getOrCreateChat, getChatList, getChatById } = require("../controllers/chatController");

route.post("/get-or-create", requireAuth, getOrCreateChat);
route.get("/", requireAuth, getChatList);
route.get("/:chatId", requireAuth, getChatById);

module.exports = route;
