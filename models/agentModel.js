const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const AgentSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Auth",
    default: null,
    sparse: true, // allows multiple nulls; unique when set
  },
  landlordId: {
     type: mongoose.Schema.Types.ObjectId,
    ref: "Auth",
     default: null,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: (value) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      },
      message: 'Please enter a valid email address',
    },
  },
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  availability: {
    type: String,
    enum: ["available", "busy", "unavailable"],
    default: "available",
  },
  specialization: {
    type: [String],
    default: [],
  },
  company: {
    type: String,
    trim: true,
  },
  address: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0,
  },
  totalJobs: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

// Indexes
AgentSchema.index({ userId: 1 }, { sparse: true, unique: true });
AgentSchema.index({ email: 1 });
AgentSchema.index({ availability: 1 });
AgentSchema.index({ status: 1 });

module.exports = mongoose.model("Agent", AgentSchema);
