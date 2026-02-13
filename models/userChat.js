const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userChatSchema = new Schema({
    messageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref : "Messages"
    },
     recipientId : {
        type: mongoose.Schema.Types.ObjectId,
        ref : "Auth"
    },
}, { timestamps: true })

module.exports = mongoose.model("UserChats", userChatSchema)