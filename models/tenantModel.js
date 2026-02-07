const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const TenantSchema = new Schema({
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Applications",
    required: true,
    unique: true,
  },
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Property",
    required: true,
    unique: true, // Enforce one tenant per property
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Auth",
    required: true,
  },
  // Store key tenant info for quick access
  email: {
    type: String,
    required: true,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  moveInDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ["active", "inactive", "terminated"],
    default: "active",
  },
}, { timestamps: true });

// Compound index to ensure one tenant per property
TenantSchema.index({ propertyId: 1 }, { unique: true });

// Index for efficient queries
TenantSchema.index({ userId: 1 });
TenantSchema.index({ applicationId: 1 });

module.exports = mongoose.model("Tenant", TenantSchema);
