const jwt = require("jsonwebtoken")
const Auth = require("../models/authModel")
require("dotenv").config()
const requireAuth = async (req, res, next) => {
    const { authorization } = req.headers
    if (!authorization) {
        return res.status(401).json({error : "UnAuthorized"})
    }
     if (!authorization.split(" ")[1] || !authorization.startsWith("Bearer")) {
        return res.status(401).json({error : "No token found"})
     }
    
    try {
        const decoded = jwt.verify(authorization.split(" ")[1], process.env.ACCESS_TOKEN_SECRET)
        if (!decoded) {
     return res.status(401).json({error : "UnAuthorized"})
}
        const _id = await Auth.findOne({ _id: decoded._id }).select("_id")
        if (!_id) {
             return res.status(401).json({error : "User not found"})
        }
        req.user = _id
        next()
    } catch (err) {
         return res.status(401).json({error : "UnAuthorized"})
    }
}
module.exports = requireAuth