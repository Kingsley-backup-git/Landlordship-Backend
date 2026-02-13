const joinHandler = require("./join");
const Messages = require("../../models/messageModel");
const Chat = require("../../models/chatModel");

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("Connected:", socket.id);
    joinHandler(socket);

    /**
     * Send a message in a chat
     * Emits 'receive_message' to both participants
     * Emits 'chat_list_update' to both participants with updated chat
     */
    socket.on("send_message", async (data) => {
      try {
        const { chatId, senderId, receiverId, message } = data;

        if (!chatId || !senderId || !receiverId || !message) {
          socket.emit("error", { message: "Missing required fields" });
          return;
        }

        // Verify chat exists
        const chat = await Chat.findById(chatId);
        if (!chat) {
          socket.emit("error", { message: "Chat not found" });
          return;
        }

        // Verify sender is a participant
        const isParticipant = chat.participants.some(
          (p) => p.toString() === senderId.toString()
        );

        if (!isParticipant) {
          socket.emit("error", { message: "You are not a participant in this chat" });
          return;
        }

        // Create the message
        const newMessage = await Messages.create({
          chatId,
          senderId,
          receiverId,
          message: message.trim()
        });

        // Update chat's lastMessage and lastMessageAt
        chat.lastMessage = newMessage._id;
        chat.lastMessageAt = newMessage.createdAt;
        await chat.save();

        // Populate message details
        const populatedMessage = await Messages.findById(newMessage._id)
          .populate("senderId", "userName email")
          .populate("receiverId", "userName email");

        // Emit message to both participants
        io.to([receiverId.toString(), senderId.toString()]).emit("receive_message", populatedMessage);
const result =  await Messages.updateMany(
            {
              chatId,
              receiverId: senderId,
              read: false
            },
            {
              $set: { read: true }
            }
     );
      
 
  io.to(senderId).emit("refresh-chat", result)
        // Get updated chat with populated fields
        const updatedChat = await Chat.findById(chatId)
          .populate("participants", "userName email isAgent isTenant")
          .populate("lastMessage");

        // Emit chat list update to both participants
        io.to([receiverId.toString(), senderId.toString()]).emit("chat_list_update", updatedChat);
        
          io.to(receiverId.toString()).emit("refresh-chat", {acknowledged : true})

      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    /**
     * Join a specific chat room
     * Useful for future features like typing indicators
     */
    socket.on("join_chat", async(data) => {
      const { chatId, userId } = data;

      
       if (!chatId || !userId) {
          socket.emit("error", { message: "Missing required fields" });
          return;
       }
      
         const chat = await Chat.findById(chatId);
        if (!chat) {
          socket.emit("error", { message: "Chat not found" });
          return;
        }
    
       const isParticipant = chat.participants.some(
      (p) => p.toString() === userId.toString()
    );
      
       if (!isParticipant) {
          socket.emit("error", { message: "You are not a participant in this chat" });
          return;
       }
            if (chat) {
        socket.join(chatId);
        console.log(`Socket ${socket.id} joined chat ${chatId}`);
      }
     const result =  await Messages.updateMany(
            {
              chatId,
              receiverId: userId,
              read: false
            },
            {
              $set: { read: true }
            }
     );
      
 
  io.to(userId).emit("refresh-chat", result)
    });

   // When user starts typing
socket.on("typing", ({ chatId, userId }) => {
  if (!chatId || !userId) return;

  // Emit to everyone in the room except the sender
  socket.to(chatId).emit("user-typing", {
    chatId,
    userId,
  });
});

// When user stops typing
socket.on("stop-typing", ({ chatId, userId }) => {
  socket.to(chatId).emit("user-stop-typing", {
    chatId,
    userId,
  });
});

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
};

