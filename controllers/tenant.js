const Tenant = require("../models/tenantModel");
const Auth = require("../models/authModel");
const Property = require("../models/propertyModel");
async function getTenants(req, res) {
    try {
 const { _id } = req.user
    
    if (!_id) {
          return res.status(401).json({ 
            error: "Only tenants can access this endpoint" 
          }); 
    }
     // Verify user is a tenant
        const user = await Auth.findById(_id);
        if (!user || user.isTenant !== true) {
          return res.status(403).json({ 
            error: "Only tenants can access this endpoint" 
          });
        }
    
      const tenant = await Tenant.findOne({ userId: _id }).populate([
          { path: "userId", select: "email userName slug isTenant isAgent" },
        { path: "propertyId", select: "propertyName address city state country landlordId", populate : {path : "landlordId"} },
        { path: "applicationId", select: "firstName lastName email phone move_in_date status" },
        ])
        
        return res.status(200).json({
            data : tenant
        })
    } catch (error) {
        console.log(error)
        if (error?.name === "ValidationError") {
            return res.status(400).json({error: Object.values(error?.errors).map(err=> err.message)})
        }

        return res.status(500).json({ error: "Server error" });
    }
   
    

}

/**
 * Landlord fetches all tenants under their properties.
 * GET /api/tenant/landlord
 *
 * Landlord is implicit (any authenticated user), but results are scoped by ownership:
 * Property.landlordId === req.user._id
 */
async function getLandlordTenants(req, res) {
  try {
    const { _id } = req.user;
const {propertyId} = req.params
if(!propertyId) {
  return res.status(400).json({error : "Property id is required"})
}
    if (!_id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Ensure user exists
    const user = await Auth.findById(_id).select("_id");
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

  

    const tenants = await Tenant.find({ propertyId })
      .populate([
        { path: "userId", select: "email userName slug isTenant isAgent" },
        { path: "propertyId", select: "propertyName address city state country landlordId" },
        { path: "applicationId", select: "firstName lastName email phone move_in_date status" },
      ])
      .sort({ createdAt: -1 });

    return res.status(200).json({
      data: tenants,
    
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Server error" });
  }
}

module.exports = {
    getTenants,
    getLandlordTenants,
};