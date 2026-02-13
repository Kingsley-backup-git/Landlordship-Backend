const Messages = require("../models/messageModel");
const Chat = require("../models/chatModel");
const Auth = require("../models/authModel");
const mongoose = require("mongoose");

/**
 * Send a message in a chat
 * Updates the chat's lastMessage and lastMessageAt
 */
async function sendMessage(req, res) {
  try {
    const { _id } = req.user;
    const { chatId } = req.params;
    const { message } = req.body;

    if (!_id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!chatId || !mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ error: "Valid chat ID is required" });
    }

    if (!message || message.trim() === "") {
      return res.status(400).json({ error: "Message cannot be empty" });
    }

    // Verify chat exists
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    // Verify user is a participant
    const isParticipant = chat.participants.some(
      (p) => p.toString() === _id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ error: "You are not a participant in this chat" });
    }

    // Get the other participant (receiver)
    const receiverId = chat.participants.find(
      (p) => p.toString() !== _id.toString()
    );

    // Create the message
    const newMessage = await Messages.create({
      chatId,
      senderId: _id,
      receiverId,
      message: message.trim()
    });

    // Update chat's lastMessage and lastMessageAt
    chat.lastMessage = newMessage._id;
    chat.lastMessageAt = newMessage.createdAt;
    await chat.save();

    // Populate sender and receiver info
    const populatedMessage = await Messages.findById(newMessage._id)
      .populate("senderId", "userName email")
      .populate("receiverId", "userName email");

    res.status(201).json({ data: populatedMessage });

  } catch (error) {
    console.log(error);
    
    if (error?.name === "ValidationError") {
      return res.status(400).json({
        error: Object.values(error?.errors).map((err) => err?.message)
      });
    }

    return res.status(500).json({ error: "Server error" });
  }
}

/**
 * Get all messages for a specific chat
 * Verify user is a participant
 */
async function getMessages(req, res) {
  try {
    const { _id } = req.user;
    const { chatId } = req.params;

    if (!_id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!chatId || !mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ error: "Valid chat ID is required" });
    }

    // Verify chat exists
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    // Verify user is a participant
    const isParticipant = chat.participants.some(
      (p) => p.toString() === _id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ error: "You are not a participant in this chat" });
    }

    // Fetch all messages for this chat
    const messages = await Messages.find({ chatId })
      .populate("senderId", "userName email")
      .populate("receiverId", "userName email")
      .sort({ createdAt: 1 }); // Oldest first

    res.status(200).json({ data: messages });

  } catch (error) {
    console.log(error);
    
    if (error?.name === "ValidationError") {
      return res.status(400).json({
        error: Object.values(error?.errors).map((err) => err?.message)
      });
    }

    return res.status(500).json({ error: "Server error" });
  }
}

/**
 * Mark messages as read in a chat
 * Marks all unread messages from the other participant as read
 */
async function markAsRead(req, res) {
  try {
    const { _id } = req.user;
    const { chatId } = req.params;

    if (!_id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!chatId || !mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ error: "Valid chat ID is required" });
    }

    // Verify chat exists
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    // Verify user is a participant
    const isParticipant = chat.participants.some(
      (p) => p.toString() === _id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ error: "You are not a participant in this chat" });
    }

    // Mark all unread messages where current user is the receiver as read
    const result = await Messages.updateMany(
      {
        chatId,
        receiverId: _id,
        read: false
      },
      {
        $set: { read: true }
      }
    );

    res.status(200).json({ 
      message: "Messages marked as read",
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Server error" });
  }
}

module.exports = {
  sendMessage,
  getMessages,
  markAsRead
};