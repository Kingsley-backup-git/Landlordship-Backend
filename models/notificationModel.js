const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const NotificationSchema = new Schema({
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Auth",
    required: true,
  },
  type: {
    type: String,
    enum: ["maintenance_assignment", "maintenance_accepted", "maintenance_rejected", "maintenance_completed", "agent_assignment"],
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  maintenanceRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MaintenanceRequest",
    default: null,
  },
  read: {
    type: Boolean,
    default: false,
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {},
  },
}, { timestamps: true });

NotificationSchema.index({ recipientId: 1 });
NotificationSchema.index({ read: 1 });
NotificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Notification", NotificationSchema);
