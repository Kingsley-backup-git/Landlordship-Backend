const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const MaintenanceRequestSchema = new Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tenant",
    required: true,
  },
  landlordId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Auth",
    required: true,
  },
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Property",
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: [200, "Title cannot exceed 200 characters"],
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected", "assigned_pending", "assigned", "completed"],
    default: "pending",
  },
  assignedAgentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Agent",
    default: null,
  },
  images: [{
    url: String,
    public_id: String,
  }],
  priority: {
    type: String,
    enum: ["low", "medium", "high", "urgent"],
    default: "medium",
  },
  estimatedCost: {
    type: Number,
    default: null,
  },
  completedAt: {
    type: Date,
    default: null,
  },
  notes: {
    type: String,
    trim: true,
  },
}, { timestamps: true });

// Indexes for efficient queries
MaintenanceRequestSchema.index({ tenantId: 1 });
MaintenanceRequestSchema.index({ landlordId: 1 });
MaintenanceRequestSchema.index({ propertyId: 1 });
MaintenanceRequestSchema.index({ status: 1 });
MaintenanceRequestSchema.index({ assignedAgentId: 1 });
MaintenanceRequestSchema.index({ createdAt: -1 });

module.exports = mongoose.model("MaintenanceRequest", MaintenanceRequestSchema);
