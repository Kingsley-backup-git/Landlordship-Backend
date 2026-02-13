const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ChatSchema = new Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Auth",
    required: true
  }],
    chatKey: {
    type: String,
    unique: true 
  },
  context: {
    type: {
      type: String,
      enum: ["maintenance", "property", "general"],
      default: "general"
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    }
  },

  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Messages",
    default: null
  },
  lastMessageAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

// Ensure participants array always has exactly 2 users
ChatSchema.pre("save", async function() {
  if (this.participants.length !== 2) {
    throw new Error("A chat must have exactly 2 participants");
  }

  this.participants.sort((a, b) =>
    a.toString().localeCompare(b.toString())
  );
});

// Indexes for efficient queries
// ChatSchema.index({ participants: 1 }, { unique: true }); // Prevent duplicate chats
ChatSchema.index({ lastMessageAt: -1 }); // For sorting chat list
ChatSchema.index({ "context.referenceId": 1 }); // For context-based queries

module.exports = mongoose.model("Chat", ChatSchema);
