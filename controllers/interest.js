const Interest = require("../models/interestModel")
const mongoose = require("mongoose")
const Notification = require("../models/notificationModel")
const Property = require("../models/propertyModel")

const {pushNotification} = require("../services/websocket/pushNotification")
const { getIO } = require("../services/globalServer");



const InterestApplication = async (req, res) => {
    const { propertyId } = req.params

    try {
        const io = getIO();
        if (!propertyId) {
            return res.status(400).json({ error: "Property is is required" })
        }
        const property = await Property.findOne({ _id: propertyId })

        if (!property) {
            return res.status(404).json({ error: "Property cannot be found" })
        }
        const findInterest = await Interest.findOne({ email: req.body.email, propertyId })
        if (findInterest) {
            return res.status(400).json({ error: "Email already applied for this property" })
        }
        const interest = await new Interest({
            ...req.body,
            propertyId
        })

        await interest.save()
       const payload = await Notification.create({
            recipientId: property?.landlordId,
            title: "New Property Interest",
            message: "There is a new property interest",
            metadata: {

                propertyId: propertyId,

                name: property?.propertyName

            },
            type: "property_interest",

            read: false



       })
        
          await pushNotification(io, property?.landlordId.toString(), payload);
        res.status(200).json({ data: interest })
    } catch (error) {
        console.log(error)
        if (error.name === "ValidationError") {
            return res.status(400).json({ error: Object.values(error?.errors).map((err) => err?.message) })
        }

        return res.status(400).json({ error: "Server error" })
    }
}

const getInterests = async (req, res) => {
    try {
        const { _id } = req.user
        const { propertyId } = req.params
        if (!_id) {
            return res.status(400).json({ error: "Unauthorized" })
        }
        if (!propertyId) {
            return res.status(400).json({ error: "Property Id is required" })
        }
        if (!mongoose.Types.ObjectId.isValid(propertyId)) {
            return res.status(400).json({ error: "Invalid Id" })
        }

        const interest = await Interest.find({ propertyId })

        return res.status(200).json({ data: interest })
    } catch (error) {
        return res.status(500).json({ error: "Server error" })
    }

}

module.exports = {
    InterestApplication,
    getInterests
}