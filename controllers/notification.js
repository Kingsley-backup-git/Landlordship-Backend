const Notification = require("../models/notificationModel");
const Auth = require("../models/authModel");
const mongoose = require("mongoose");

/**
 * Get notifications for the current user
 * GET /api/notifications
 */
const getMyNotifications = async (req, res) => {
  try {
    const { _id } = req.user;
    if (!_id) return res.status(401).json({ error: "Unauthorized" });

    const { read, limit = 50 } = req.query;
    const query = { recipientId: _id };
    if (read !== undefined) query.read = read === "true";

    const notifications = await Notification.find(query)
      .populate("maintenanceRequestId", "title status propertyId")
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .lean();

    res.status(200).json({ data: notifications });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Mark a notification as read
 * PATCH /api/notifications/:id/read
 */
const markAsRead = async (req, res) => {
  try {
    const { _id } = req.user;
    const { id } = req.params;
    if (!_id) return res.status(401).json({ error: "Unauthorized" });
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Valid notification ID is required" });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipientId: _id },
      { read: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ error: "Notification not found" });

    res.status(200).json({ data: notification });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { getMyNotifications, markAsRead };
