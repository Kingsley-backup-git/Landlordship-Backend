const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/authMiddleware");
const { getMyNotifications, markAsRead } = require("../controllers/notification");

router.get("/", requireAuth, getMyNotifications);
router.patch("/:id/read", requireAuth, markAsRead);

module.exports = router;
