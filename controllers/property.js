const cloudinary = require("../config/cloudinary");
const Property = require("../models/propertyModel");
const Auth = require("../models/authModel")
const mongoose = require("mongoose")
const createProperty = async (req, res) => {
  try {
    const { _id } = req.user;
      const { document_name } = req.body
      console.log(req.body)
    if (!_id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

      if (document_name) {
          return res.status(401).json({ error: "document_name is required" });
      }
 
    const property_images = [];

    for (const file of req.files.property_images) {
      const result = await cloudinary.uploader.upload(file.path, {
        resource_type: "image",
      });
      if (result) {
        property_images.push(result?.secure_url);
      }
    }

  const property_documents = [];
if (req.files?.property_documents) {
  for (const file of req.files.property_documents) {
    const docResult = await cloudinary.uploader.upload(file.path, { resource_type: "raw" });
    property_documents.push({
      name: req.body.document_name, 
      url: docResult.secure_url,
    });
  }
}
   

    const property = await Property.create({
      ...req.body,
      square_feet: Number(req.body.square_feet),
      bedrooms: Number(req.body.bedrooms),
      bathrooms: Number(req.body.bathrooms),
      parkingspaces: Number(req.body.parkingspaces),
      property_value : Number(req.body.property_value),
      property_images,
      property_documents,
      landlordId: _id,
    });

    res.status(201).json({
      data: property,
    });
  } catch (error) {
   
    if (error?.name === "ValidationError") {
      return res.status(400).json({
        error: Object.values(error?.errors).map((err) => err?.message),
      });
    }
    if (error.code === 11000) {
      return res.status(400).json({
        error: "Property name already exists",
      });
    }
    if (error?.http_code) {
        return res.status(400).json({
        error: "Failed to upload documents",
      });
    }
    console.log(error);
    return res.status(500).json({ error: "Server error" });
  }
};
const getProperties = async (req, res) => {
    try {
        const { _id } = req.user;

        if (!_id) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const Properties = await Property.find({ landlordId: _id })
        
      
      
     res.status(200).json({data : Properties})

    }
    catch (error) {
        return res.status(500).json({error : "Server error"})
    }
}
const getEachProperty = async (req, res) => {
    try {
        const { propertyId } = req.params;

        if (!propertyId) {
            return res.status(400).json({ error: "property id is required" });
        }
      if (!mongoose.Types.ObjectId.isValid(propertyId)) {
    return res.status(400).json({ error: "property id is invalid" });
}
   
      const Properties = await Property.findOne({_id : propertyId}).populate("landlordId")
      
      if (!Properties) {
          return res.status(404).json({ error: "No Property found" });
    }
      res.status(200).json({
        data: {
         
          Properties
     }})

    }
    catch (error) {
      console.log(error)
        return res.status(500).json({error : "Server error"})
    }
}

const getEachPropertyForLoggedInUsers = async (req, res) => {
  
  
    try {
        const { propertyId } = req.params;
        const { _id } = req.user
if (!_id) {
      return res.status(400).json({ error: "Unauthorized" });
  }
        if (!propertyId) {
            return res.status(400).json({ error: "property id is required" });
        }
      if (!mongoose.Types.ObjectId.isValid(propertyId)) {
    return res.status(400).json({ error: "property id is invalid" });
}
   
      const Properties = await Property.findOne({_id : propertyId, landlordId : _id}).populate("landlordId")
      
      if (!Properties) {
          return res.status(404).json({ error: "No Property found" });
    }
      res.status(200).json({
        data: {
         
          Properties
     }})

    }
    catch (error) {
      console.log(error)
        return res.status(500).json({error : "Server error"})
    }
}

const getPropertiesBySlug = async (req, res) => {
    try {
        const { slug } = req.params;

        if (!slug) {
            return res.status(400).json({ error: "Username is required" });
        }

      const User = await Auth.findOne({ slug })
       if (!User) {
      return res.status(404).json({ error: "User not found" });
    }
      const Properties = await Property.find({landlordId : User?._id})
      
    
      res.status(200).json({
        data: {
          landlord: {
            email: User?.email,
            userName: User?.userName,
            slug : User?.slug
          },
          Properties
     }})

    }
    catch (error) {
      console.log(error)
        return res.status(500).json({error : "Server error"})
    }
}

const getPaginatedProperties = async (req, res) => {
    try {
       
        const { _id } = req.user;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
       
        if (!_id) {
            return res.status(401).json({ error: "Unauthorized" });
        }
  
        const skipPages = (page - 1) * limit

      const [properties, total] = await Promise.all([
      Property.find({ landlordId: _id })
        .sort({ createdAt: -1 })
        .skip(skipPages)
        .limit(limit),

      Property.countDocuments({ landlordId: _id })
    ]);
        
        res.status(200).json({
            data: {
                properties,
                pagination: {
                    total,
                    limit,
                    page,
                    totalPages : Math.ceil(total/limit),
                    hasMore : page !==   Math.ceil(total/limit) 
                }
     }})

    }
    catch (error) {
        console.log(error)
        return res.status(500).json({ error: "Server error" })
        
    }
}
module.exports = {
  createProperty,
    getProperties,
  getPaginatedProperties,
  getPropertiesBySlug,
  getEachProperty,
  getEachPropertyForLoggedInUsers
};
