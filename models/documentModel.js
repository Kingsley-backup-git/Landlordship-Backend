const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const DocumentSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auth",
    },
    name: {
      type: String,
      required: true,
      unique: true,
    },
    url: {
      type: String,
      required: true,
    },

    public_id: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["lease", "ownership", "insurance"],
      required: true,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Documents", DocumentSchema);
