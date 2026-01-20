const mongoose = require("mongoose")
const Schema = mongoose.Schema

const authSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique : true,
 validate: {
    validator: (value) => {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    },
    message: 'Please enter a valid email address'
  }
    },
    password: {
        type: String,
        minlength: [6, "Password must be atleast 6 characters long"],
        required: true,
   
    },
  
    userName: {
        type: String,
        required : true
    },
    slug: {
        type: String,
        unique:true
    },
    role: {
        type: String,
        enum : ["tenant", "landlord"],
        default : "landlord"
    },
     

}, { timestamps: true })

module.exports = mongoose.model("Auth", authSchema)