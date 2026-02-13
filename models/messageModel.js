const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const MessageSchema = new Schema({
    chatId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Chat",
        required: true
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Auth",
        required: true
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Auth",
        required: true
    },
    message: {
        type: String,
        required: true
    },
    read: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Indexes for efficient queries
MessageSchema.index({ chatId: 1, createdAt: -1 }); // For fetching messages by chat
MessageSchema.index({ receiverId: 1, read: 1 }); // For unread message queries

module.exports = mongoose.model("Messages", MessageSchema)