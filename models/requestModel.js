const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const RequstSchema = new Schema({
    agentId: {
        ref: "Auth",
        type: mongoose.Schema.Types.ObjectId,
        
  }
}, { timestamps: true });



module.exports = mongoose.model("Request", RequstSchema);
