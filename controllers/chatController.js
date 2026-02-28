const Chat = require("../models/chatModel");
const Auth = require("../models/authModel");
const MaintenanceRequest = require("../models/maintenanceRequestModel");
const mongoose = require("mongoose");
const Agent = require("../models/agentModel")
const Messages = require("../models/messageModel")
/**
 * Get or create a chat between two users
 * If a chat already exists between the participants, return it
 * Otherwise, create a new chat
 */
const getOrCreateChat = async (req, res) => {
  try {
    const { _id } = req.user;
    const { otherUserId, context, maintenanceId } = req.body;

    if (!_id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!otherUserId) {
      return res.status(400).json({ error: "otherUserId is required" });
    }

    // Prevent chatting with self
    if (_id.toString() === otherUserId.toString()) {
      return res.status(400).json({ error: "Cannot create a chat with yourself" });
    }

    // Validate other user exists
    const otherUser = await Auth.findById(otherUserId);
    if (!otherUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Sort participants to ensure consistent ordering for uniqueness
    const participants = [_id, otherUserId].sort((a, b) => 
      a.toString().localeCompare(b.toString())
    );
const chatKey = participants.join("_"); 
    // Try to find existing chat
    let chat = await Chat.findOne({ chatKey, maintenanceRequestId:maintenanceId })
      .populate("participants", "userName email")
      .populate("lastMessage");

    if (chat) {
      return res.status(200).json({ data: chat });
    }

    // Create new chat
    const chatData = {
      participants,
      chatKey,
      maintenanceRequestId:maintenanceId,
      context: context || { type: "general", referenceId: null }
    };

    chat = await Chat.create(chatData);
    
    // Populate before returning
    chat = await Chat.findById(chat._id)
      .populate("participants", "userName email")
      .populate("lastMessage");

    return res.status(201).json({ data: chat });

  } catch (error) {
    console.log(error);
    
    if (error?.name === "ValidationError") {
      return res.status(400).json({
        error: Object.values(error?.errors).map((err) => err?.message)
      });
    }

    if (error?.code === 11000) {
      return res.status(400).json({ error: "Chat already exists" });
    }

    return res.status(500).json({ error: "Server error" });
  }
};

/**
 * Get all chats for the authenticated user
 * For agents: include maintenance request context when applicable
 */
const getChatList = async (req, res) => {
  try {
    const { _id } = req.user;

    if (!_id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Find all chats where user is a participant
    let chats = await Chat.find({ participants: _id })
      .populate("participants", "userName email isAgent isTenant")
      .populate("lastMessage")
      .sort({ lastMessageAt: -1 });

    // For each chat, check if we need to attach maintenance context
    const chatsWithContext = await Promise.all(
      chats.map(async (chat) => {
        const chatObj = chat.toObject();
        
        // Get the other participant
        const otherParticipant = chatObj.participants.find(
          (p) => p._id.toString() !== _id.toString()
        );

        // Check if this is an agent-landlord chat with maintenance context
        const currentUser = await Auth.findById(_id);
        
        if (currentUser.isAgent && otherParticipant) {
          const agent = await Agent.findOne({userId : _id})
          // Find maintenance requests where:
          // - landlord created it (otherParticipant is landlord)
          // - agent was assigned (current user is agent)
          const maintenanceRequests = await MaintenanceRequest.find({
            landlordId: otherParticipant._id,
            assignedAgentId: agent._id
          })
          .populate("propertyId", "title address")
          .sort({ createdAt: -1 });

          if (maintenanceRequests.length > 0) {
            chatObj.maintenanceRequests = maintenanceRequests;
          }

        }
   const result = await Messages.find(
      {
        chatId : chat?._id,
        receiverId: _id,
        read: false
      }
   );
        if (result.length > 0) {
          chatObj.unreadMessages  = result.length
        }
        
        return chatObj;
      })
    );

    return res.status(200).json({ data: chatsWithContext });

  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Server error" });
  }
};

/**
 * Get a single chat by ID
 * Verify user is a participant
 */
const getChatById = async (req, res) => {
  try {
    const { _id } = req.user;
    const { chatId } = req.params;

    if (!_id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!chatId || !mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ error: "Valid chat ID is required" });
    }

    const chat = await Chat.findById(chatId)
      .populate("participants", "userName email isAgent isTenant")
      .populate("lastMessage").populate("maintenanceRequestId");

    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    // Verify user is a participant
    const isParticipant = chat.participants.some(
      (p) => p._id.toString() === _id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ error: "You are not a participant in this chat" });
    }

    const chatObj = chat.toObject();

    // Get the other participant
    const otherParticipant = chatObj.participants.find(
      (p) => p._id.toString() !== _id.toString()
    );

    // Check if we need to attach maintenance context
    const currentUser = await Auth.findById(_id);
   
    
    if (currentUser.isAgent && otherParticipant) {
       const agent = await Agent.findOne({userId : _id})
      const maintenanceRequests = await MaintenanceRequest.find({
        landlordId: otherParticipant._id,
        assignedAgentId: agent?._id,
        status : "assigned_pending"
      })
      .populate("propertyId", "title address")
      .sort({ createdAt: -1 });

      if (maintenanceRequests.length > 0) {
        chatObj.maintenanceRequests = maintenanceRequests;
      }
    }

    return res.status(200).json({ data: chatObj });

  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  getOrCreateChat,
  getChatList,
  getChatById
};
