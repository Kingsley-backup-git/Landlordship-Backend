const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PropertySchema = new Schema({
    landlordId: {
        type: mongoose.Schema.Types.ObjectId,
        ref : "Auth"
    },
  propertyName: {
    type: String,
    required: true,
    unique: true,
  },
  address: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  postalcode: {
    type: Number,
  },
  country: {
    type: String,
    required: true,
  },
  propertyType: {
    type: String,
    enum: [
      "apartment",
      "duplex",
      "studio",
      "condominium",
      "serviced-apartment",
      "office",
      "hotel",
      "warehouse",
      "townhouse",
    ],
  },
  year_built: {
    type: Number,
   validate: {
    validator: function (value) {
      const currentYear = new Date().getFullYear();
      return value >= 1800 && value <= currentYear;
    },
    message: 'Year built must be between 1800 and the current year'
  },
    required: true,
  },
  renovation_year: {
      type: Number,
       validate: {
    validator: function (value) {
      if (!value) return true;
      return value >= this.year_built;
    },
    message: 'Renovation year cannot be before year built'
  }
  },
  square_feet: {
    type: Number,
    required: true,
  },
  bedrooms: {
    type: Number,
    required: true,
  },
  bathrooms: {
    type: Number,
    required: true,
  },
  parkingspaces: {
    type: Number,
  },
  property_description: {
    type: String,
  },
  additional_features: [String],
  property_value: {
    type: Number,
    required: true,
  },
  last_appraisal_date: {
    type: Date,
  },
  property_images: [String],
  property_documents: [
    {
      name: String,
      url: String,
    },
  ],
  initial_status: {
    type: String,
  },
},{timestamps:true});


module.exports = mongoose.model("Property", PropertySchema)