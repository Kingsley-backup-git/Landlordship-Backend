const mongoose = require("mongoose")

const Schema = mongoose.Schema

const InterestSchema = new Schema({
  propertyId: {
    type:mongoose.Schema.Types.ObjectId,
    ref : "Property"
  },
    email: {
        type: String,
        required: true,
         lowercase: true,
      trim: true,
        validate: {
    validator: (value) => {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    },
    message: 'Please enter a valid email address'
  }
  },
  firstName: {
    type: String,
    required: true
   
  },
  lastName: {
     type: String,
    required: true
  },

  reason: {
    type: String,
    trim:true
  },
  phone: {
    type: String,
       required: true,
      trim: true
  },
  moveInDate: {
    type: Date,
    required: true,
     validate: {
            validator: (value) => {
                return new Date(value) >= new Date
            },
            message: "move_in_date cannot be in the past"
        }
  },
  status: {
      type: String,
      enum: ["pending", "rejected", "approved"],
      default: "pending",
    },

}, {timestamps : true})

module.exports = mongoose.model("Interest", InterestSchema)