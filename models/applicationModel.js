const mongoose = require("mongoose")
const Schema = mongoose.Schema
const ApplicationSchema = new Schema({
    propertyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref : "Property"
    },
    firstName: {
        type: String,
        trim: true,
        required: true,
        
    },
      lastName: {
        type: String,
        trim: true,
        required: true,
        
    },
        middleName: {
        type: String,
        trim: true,
        required: false,
        
    },
    dob: {
        type: Date,
        required: true,
        validate: {
            validator: (value) => {
               return new Date(value) < new Date()
            },
             message : "Date of birth cannot be in the future"
        },
       
    },
    country: {
        type: String,
        required:true
    },
     nationalInsuranceNumber: {
        type: String,
        required:false
    },
    phone: {
          type: String,
        required:true
    },
     email: {
        type: String,
        required: true,
   
 validate: {
    validator: (value) => {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    },
    message: 'Please enter a valid email address'
  }
    },
       address: {
    type: String,
    required: true,
    },
        postalcode: {
    type: String,
    required:true
    },
    reasonforleaving: {
        type: String,
        required:true
    },
    previousAddress: {
         type: String,
        required:false
    },
    idType: {
         type: String,
        required: true,
        enum : ["passport", "driverlicense", "nationalIdCard", "biometricResidencePermit"]
    },
    idNumber: {
    type: String,
        required: true,
    },
    residencyStatus: {
        type: String,
        enum: ["ukCitizen", "eu", "visaHolder", "other"],
        required:true
    },
    shareCode: {
        type:String
    },
    idDoc: {
        type: String,
        required:true
    },
    addressDoc: {
          type: String,
        required:true
    },
    consent_to_rent: {
        type: Boolean,
        required:true,
      enum : [true, "consent to rent is required"]
    },
    employmentStatus: {
             type: String,
        enum: ["self_employed", "employed_fulltime", "employed_partime", "student", "unemployed", "retired"],
          required:true
    },
    jobTitle: {
         type: String,
        required:true
    },
    employer_name: {
           type: String,
        required:false
    },
       employer_address: {
           type: String,
        required:false
    },
    length_of_employment_year: {
              type: Number,
        required: true,
     
    },
    
       length_of_employment_month: {
              type: Number,
        required: true
    },
    monthly_income: {
        type: Number,
        required:true
    },
     annual_income: {
        type: Number,
        required:true
    },
    recent_payment_slip: [{
         url: { type: String, required: true },
  public_id: { type: String, required: true },
  resourceType: { type: String, required: true }
    }],
      recent_bank_statement:[ {
            url: { type: String, required: true },
  public_id: { type: String, required: true },
  resourceType: { type: String, required: true }
    }],
    move_in_date: {
           type: Date,
        required: true,
        validate: {
            validator: (value) => {
                return new Date(value) >= new Date
            },
            message: "move_in_date cannot be in the past"
        }
    },
    preferred_tenancy_length: {
           type: String,
        required:true
    },
    // property_address: {
    //       type: String,
    //     required:true
    // },
    // monthly_rent: {
    //      type: String,
    //     required:true
    // },
    number_of_tenant: {
        type: Number,
        required:true
    },
    names_of_coTenants: {
        type:String,
    },
    pets: {
        type: String,
        required:true,
     enum : ["yes", "no"]
        
    },
      smoke: {
          type: String,
          required:true,
     enum : ["yes", "no"]
        
    },
      require_parking: {
          type: String,
          required:true,
     enum : ["yes", "no"]
        
    },
    special_request: {
             type: String
    },
      ccjs: {
          type: String,
          required:true,
     enum : ["yes", "no"]
        
    },
      bankrupt: {
          type: String,
          required:true,
     enum : ["yes", "no"]
        
    },
    housing_benefit: {
            type: String,
          required:true,
     enum : ["yes", "no"]
    },
    consent_credit_check: {
         type: Boolean,
          required:true,
     enum : [true]
    },
    proof_of_income: [{
          url: { type: String, required: true },
  public_id: { type: String, required: true },
  resourceType: { type: String, required: true }
    }],
    recent_landlord_name: {
          type: String,
    },
     recent_landlord_email: {
        type: String,
            lowercase: true,
      trim: true,
        validate: {
    validator: (value) => {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    },
    message: 'Please enter a valid email address'
  }
    },
     recent_landlord_duration_of_tenancy: {
              type: String,
    },
     recent_landlord_rent_paid: {
          type: String,
    },
   
    reference_name: {
           type: String,
    },
    reference_relationship: {
         type: String,
    },
     reference_email: {
         type: String,
                 lowercase: true,
         trim: true,
      required:false,
        validate: {
    validator: (value) => {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    },
    message: 'Please enter a valid email address'
  }
    },
    reference_years_known: {
        type: String,
    },
    guarantor: {
          type: String,
        
     enum : ["yes", "no"]
    },
    consent_contact_landlord: {
           type: Boolean,
          required:true,
     enum : [true]
    },
    all_info_is_true: {
           type: Boolean,
          required:true,
     enum : [true]
    },
    agree_to_policy: {
          type: Boolean,
          required:true,
     enum : [true]
    },
    signature: {
        type: String,
        required : true
    },
    status: {
        type: String,
        enum: ["pending", "rejected", "success"],
        default : "pending"
    }
    
        
}, {timestamps : true})

module.exports = mongoose.model("Applications", ApplicationSchema)