const MaintenanceRequest = require("../models/maintenanceRequestModel");
const Tenant = require("../models/tenantModel");
const Property = require("../models/propertyModel");
const Auth = require("../models/authModel");
const Agent = require("../models/agentModel");
const Notification = require("../models/notificationModel");
const mongoose = require("mongoose");
const cloudinary = require("../config/cloudinary");
const { sendAgentAssignmentEmail } = require("../utils/emailService");

const {pushNotification} = require("../services/websocket/pushNotification")
// Landlord is implicit (any authenticated user). Extra dashboards via flags:
// - isTenant: tenant dashboard enabled
// - isAgent: agent dashboard enabled

/**
 * Tenant creates a maintenance request for their assigned property
 * POST /maintenance
 * 
 */
const { getIO } = require("../services/globalServer");



const createMaintenanceRequest = async (req, res) => {
  
  try {
    const io = getIO();
    const { _id } = req.user;

    if (!_id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { title, description, priority, propertyId } = req.body;

    if (!title || !description) {
      return res.status(400).json({ 
        error: "Title and description are required" 
      });
    }

    if (!propertyId) {
      return res.status(400).json({ error: "Property ID is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(propertyId)) {
      return res.status(400).json({ error: "Invalid property ID" });
    }

    // Verify user is a tenant
    const user = await Auth.findById(_id);
    if (!user || user.isTenant !== true) {
      return res.status(403).json({ 
        error: "Only tenants can create maintenance requests" 
      });
    }

    // Verify tenant is assigned to this property
    const tenant = await Tenant.findOne({ 
      userId: _id, 
      propertyId: propertyId,
      status: "active"
    });

    if (!tenant) {
      return res.status(403).json({ 
        error: "You are not assigned to this property" 
      });
    }

    // Get property to get landlord ID
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    // Handle image uploads if any
    let images = [];
    if (req.files && req.files) {
      images = await Promise.all(
        req.files.map(async (file) => {
          const result = await cloudinary.uploader.upload(file.path, {
            resource_type: "image",
          });
          return {
            url: result.secure_url,
            public_id: result.public_id,
          };
        })
      );
    }

    // Create maintenance request
    const maintenanceRequest = await MaintenanceRequest.create({
      tenantId: tenant._id,
      landlordId: property.landlordId,
      propertyId: propertyId,
      title,
      description,
      priority: priority || "medium",
      images,
    });

    // Populate related data
    await maintenanceRequest.populate([
      { path: "tenantId", select: "firstName lastName email phone" },
      { path: "propertyId", select: "propertyName address" },
    ]);
  const payload = await Notification.create({
        recipientId: property.landlordId,
        type: "maintenance_request_created",
        title: "New Maintenance request",
        message: `You have a new maintenance request.`,
        maintenanceRequestId: maintenanceRequest._id,
       metadata: { landlordId: property.landlordId.toString(),  tenantId:tenant._id.toString(), propertyId : propertyId },
      });

pushNotification(io, property.landlordId.toString(), payload);
    return res.status(201).json({
      message: "Maintenance request created successfully",
      data: maintenanceRequest,
    });
  } catch (error) {
    console.log(error);
    
    if (error?.name === "ValidationError") {
      return res.status(400).json({
        error: Object.values(error?.errors).map((err) => err?.message),
      });
    }

    return res.status(500).json({ error: "Server error" });
  }
};

/**
 * Tenant fetches all their own maintenance requests
 * GET /api/maintenance-request/tenant
 */
const getTenantMaintenanceRequests = async (req, res) => {
  try {
    const { _id } = req.user;

    if (!_id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Verify user is a tenant
    const user = await Auth.findById(_id);
    if (!user || user.isTenant !== true) {
      return res.status(403).json({ 
        error: "Only tenants can access this endpoint" 
      });
    }

    // Get all tenants for this user
    const tenants = await Tenant.find({ userId: _id });
    const tenantIds = tenants.map((t) => t._id);

    if (tenantIds.length === 0) {
      return res.status(200).json({ 
        data: [],
        message: "No maintenance requests found" 
      });
    }

    // Get all maintenance requests for these tenants
    const maintenanceRequests = await MaintenanceRequest.find({
      tenantId: { $in: tenantIds },
    })
      .populate([
        { path: "propertyId", select: "propertyName address city state" },
        { path: "assignedAgentId", select: "name email phone availability" },
      ])
      .sort({ createdAt: -1 });

    res.status(200).json({
      data: maintenanceRequests,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Server error" });
  }
};

/**
 * Landlord fetches all maintenance requests for his properties
 * GET /api/maintenance-request/landlord
 */
const getLandlordMaintenanceRequests = async (req, res) => {
  try {
    const { _id } = req.user;

    if (!_id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Landlord is implicit; list is scoped by landlordId below.
    const user = await Auth.findById(_id);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get all maintenance requests for this landlord's properties
    const maintenanceRequests = await MaintenanceRequest.find({
      landlordId: _id,
    })
      .populate([
        { 
          path: "tenantId", 
          select: "firstName lastName email phone moveInDate",
          populate: {
            path: "userId",
            select: "userName email",
          },
        },
        { path: "propertyId", select: "propertyName address city state" },
        { 
          path: "assignedAgentId", 
          select: "name email phone availability company" 
        },
      ])
      .sort({ createdAt: -1 });

    res.status(200).json({
      data: maintenanceRequests,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Server error" });
  }
};

/**
 * Landlord accepts or rejects a maintenance request
 * PATCH /api/maintenance-request/:requestId/status
 */
const updateMaintenanceRequestStatus = async (req, res) => {
  try {
    const { _id } = req.user;
    const { requestId } = req.params;
    const { status, notes } = req.body;

    if (!_id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!requestId) {
      return res.status(400).json({ error: "Request ID is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ error: "Invalid request ID" });
    }

    if (!status || !["pending", "accepted", "rejected", "assigned_pending", "assigned", "completed"].includes(status)) {
      return res.status(400).json({ 
        error: "Status is required and must be one of: pending, accepted, rejected, assigned_pending, assigned, completed" 
      });
    }

    // Landlord is implicit, but must own the request (checked below)
    const user = await Auth.findById(_id);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Find the maintenance request
    const maintenanceRequest = await MaintenanceRequest.findById(requestId);

    if (!maintenanceRequest) {
      return res.status(404).json({ error: "Maintenance request not found" });
    }

    // Verify landlord owns the property
    if (maintenanceRequest.landlordId.toString() !== _id.toString()) {
      return res.status(403).json({ 
        error: "You are not authorized to update this request" 
      });
    }

    // Update status
    maintenanceRequest.status = status;
    if (notes) {
      maintenanceRequest.notes = notes;
    }

    // If status is completed, set completedAt
    if (status === "completed") {
      maintenanceRequest.completedAt = new Date();
    }

    await maintenanceRequest.save();

    // Populate related data
    await maintenanceRequest.populate([
      { 
        path: "tenantId", 
        select: "firstName lastName email phone",
        populate: {
          path: "userId",
          select: "userName email",
        },
      },
      { path: "propertyId", select: "propertyName address" },
      { 
        path: "assignedAgentId", 
        select: "name email phone availability" 
      },
    ]);

    res.status(200).json({
      message: "Maintenance request status updated successfully",
      data: maintenanceRequest,
    });
  } catch (error) {
    console.log(error);
    
    if (error?.name === "ValidationError") {
      return res.status(400).json({
        error: Object.values(error?.errors).map((err) => err?.message),
      });
    }

    return res.status(500).json({ error: "Server error" });
  }
};

/**
 * Get a single maintenance request by ID
 * GET /api/maintenance-request/:requestId
 */
const getMaintenanceRequestById = async (req, res) => {
  try {
    const { _id } = req.user;
    const requestId = req.params.requestId || req.params.id;

    if (!_id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!requestId) {
      return res.status(400).json({ error: "Request ID is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ error: "Invalid request ID" });
    }

    const maintenanceRequest = await MaintenanceRequest.findById(requestId)
      .populate([
        { 
          path: "tenantId", 
          select: "firstName lastName email phone moveInDate",
          populate: {
            path: "userId",
            select: "userName email",
          },
        },
        { path: "propertyId", select: "propertyName address city state" },
        { 
          path: "assignedAgentId", 
          select: "name email phone availability company specialization" 
        },
      ]);

    if (!maintenanceRequest) {
      return res.status(404).json({ error: "Maintenance request not found" });
    }

    // Verify user has access (tenant, landlord, or assigned agent)
    const user = await Auth.findById(_id);
    const isLandlord =
      user && maintenanceRequest.landlordId.toString() === _id.toString();
    const isTenant =
      user &&
      user.isTenant === true &&
      maintenanceRequest.tenantId.userId &&
      maintenanceRequest.tenantId.userId.toString() === _id.toString();
    const agent = user && user.isAgent === true ? await Agent.findOne({ userId: _id }) : null;
    const assignedId = maintenanceRequest.assignedAgentId && (maintenanceRequest.assignedAgentId._id || maintenanceRequest.assignedAgentId);
    const isAssignedAgent = user && user.isAgent === true && agent && assignedId && assignedId.toString() === agent._id.toString();

    if (!isLandlord && !isTenant && !isAssignedAgent) {
      return res.status(403).json({ 
        error: "You are not authorized to view this request" 
      });
    }

    res.status(200).json({
      data: maintenanceRequest,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Server error" });
  }
};

/**
 * Landlord accepts a maintenance request
 * PATCH /maintenance/:id/accept
 */
const acceptRequest = async (req, res) => {
  try {
      const io = getIO();
    const { _id } = req.user;
    const { id } = req.params;

    if (!_id) return res.status(401).json({ error: "Unauthorized" });
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Valid request ID is required" });
    }

    const user = await Auth.findById(_id);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const request = await MaintenanceRequest.findById(id);
    if (!request) return res.status(404).json({ error: "Maintenance request not found" });
    if (request.landlordId.toString() !== _id.toString()) {
      return res.status(403).json({ error: "Not authorized to modify this request" });
    }
    if (request.status !== "pending") {
      return res.status(400).json({ error: "Only pending requests can be accepted" });
    }

    request.status = "accepted";
    await request.save();
    await request.populate([
      { path: "tenantId", select: "firstName lastName email phone", populate: { path: "userId", select: "userName email" } },
      { path: "propertyId", select: "propertyName address city state" },
      { path: "assignedAgentId", select: "name email phone availability" },
    ]);
      const tenant = await Tenant.findOne({ 
     _id: request.tenantId, 
    
    });
  const payload = await Notification.create({
        recipientId: tenant?.userId,
        type: "accepted_request",
        title: "Landlord accepted request",
        message: `Your landlord has accepted your maintenance request.`,
        maintenanceRequestId: request._id,
       metadata: { requestId: request._id.toString(),  tenantId: request.tenantId.toString() },
      });

    pushNotification(io,tenant?.userId.toString(), payload);
    res.status(200).json({ message: "Request accepted", data: request });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Landlord rejects a maintenance request
 * PATCH /maintenance/:id/reject
 */
const rejectRequest = async (req, res) => {
  try {
      const io = getIO();
    const { _id } = req.user;
    const { id } = req.params;

    if (!_id) return res.status(401).json({ error: "Unauthorized" });
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Valid request ID is required" });
    }

    const user = await Auth.findById(_id);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const request = await MaintenanceRequest.findById(id);
    if (!request) return res.status(404).json({ error: "Maintenance request not found" });
    if (request.landlordId.toString() !== _id.toString()) {
      return res.status(403).json({ error: "Not authorized to modify this request" });
    }
    if (request.status !== "pending") {
      return res.status(400).json({ error: "Only pending requests can be rejected" });
    }

    request.status = "rejected";
    await request.save();
    await request.populate([
      { path: "tenantId", select: "firstName lastName email phone", populate: { path: "userId", select: "userName email" } },
      { path: "propertyId", select: "propertyName address city state" },
      { path: "assignedAgentId", select: "name email phone availability" },
    ]);
  const payload = await Notification.create({
        recipientId: request.tenantId.userId._id,
        type: "rejected_request",
        title: "Landlord rejected request",
        message: `Your landlord has rejected your maintenance request.`,
        maintenanceRequestId: request._id,
        metadata: { requestId: request._id.toString(),  tenantId:request.tenantId },
      });

   pushNotification(io,request.tenantId.userId._id.toString(), payload);
    res.status(200).json({ message: "Request rejected", data: request });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Landlord assigns an agent to an accepted maintenance request
 * POST /maintenance/:id/assign-agent
 * Body: { agentId }
 */
const assignAgent = async (req, res) => {
  try {
      const io = getIO();
    const { _id } = req.user;
    const { id } = req.params;
    const { agentId } = req.body;

    if (!_id) return res.status(401).json({ error: "Unauthorized" });
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Valid request ID is required" });
    }
    if (!agentId || !mongoose.Types.ObjectId.isValid(agentId)) {
      return res.status(400).json({ error: "Valid agentId is required" });
    }

    const user = await Auth.findById(_id);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const request = await MaintenanceRequest.findById(id);
    if (!request) return res.status(404).json({ error: "Maintenance request not found" });
    if (request.landlordId.toString() !== _id.toString()) {
      return res.status(403).json({ error: "Not authorized to modify this request" });
    }
    if (request.status !== "accepted") {
      return res.status(400).json({ error: "Only accepted requests can be assigned to an agent" });
    }

    const agent = await Agent.findById(agentId);
    if (!agent) return res.status(404).json({ error: "Agent not found" });
    const findAgent = await Auth.findOne({ email: agent.email })
    if (!findAgent) {
      return res.status(404).json({ error: "Agent not found" });
    }
    if (agent.status !== "active") {
      return res.status(400).json({ error: "Agent is not active" });
    }

    request.assignedAgentId = agentId;
    request.status = "assigned_pending";
    await request.save();

    const reqPopulated = await MaintenanceRequest.findById(id)
      .populate([
        { path: "tenantId", select: "firstName lastName email phone", populate: { path: "userId", select: "userName email" } },
        { path: "propertyId", select: "propertyName address city state" },
        { path: "assignedAgentId", select: "name email phone availability company" },
      ]);
    const title = reqPopulated.title || "Maintenance request";
    const description = reqPopulated.description || "";

    const emailResult = await sendAgentAssignmentEmail(
      agent.email,
      agent.name,
      { _id: request._id, title, description, priority: reqPopulated.priority || "medium" }
    );

    if (findAgent._id) {
      agent.userId = findAgent?._id
      await Auth.updateOne({ _id: findAgent._id }, { $set: { isAgent: true } });
   
      await agent.save()
    }
      const payload = await Notification.create({
        recipientId: findAgent._id,
        type: "agent_assignment",
        title: "New maintenance assignment",
        message: `You have been assigned a request. Please confirm or reject availability.`,
        maintenanceRequestId: request._id,
        metadata: { requestId: request._id.toString(), agentId: agent._id.toString() },
      });

   pushNotification(io,findAgent._id.toString(), payload);
    res.status(200).json({
      message: "Agent assigned. Email and in-app notification sent.",
      data: reqPopulated,
      emailSent: emailResult.success,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Agent fetches all maintenance requests assigned to them (pending + active)
 * GET /maintenance/agent
 */
const getAgentMaintenanceRequests = async (req, res) => {
  try {
    const { _id } = req.user;
    if (!_id) return res.status(401).json({ error: "Unauthorized" });

    const user = await Auth.findById(_id);
    if (!user || user.isAgent !== true) {
      return res.status(403).json({ error: "Only agents can access this endpoint" });
    }

    const agent = await Agent.findOne({ email: user?.email });
    if (!agent) {
      return res.status(200).json({ data: [], message: "No agent profile linked to this account" });
    }

    const requests = await MaintenanceRequest.find({ assignedAgentId: agent._id, status: "assigned_pending" })
      .populate([
        { path: "propertyId", select: "propertyName address city state" },
        { path: "tenantId", select: "firstName lastName email phone moveInDate", populate: { path: "userId", select: "userName email" } },
        { path: "landlordId", select: "userName email" },
           { path: "assignedAgentId"},
      ])
      .sort({ createdAt: -1 });

    res.status(200).json({ data: requests });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Agent accepts a maintenance request (confirms assignment)
 * PATCH /maintenance/:id/agent-accept
 */
const agentAcceptRequest = async (req, res) => {
  try {
    const { _id } = req.user;
    const { id } = req.params;

    if (!_id) return res.status(401).json({ error: "Unauthorized" });
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Valid request ID is required" });
    }

    const user = await Auth.findById(_id);
    if (!user || user.isAgent !== true) {
      return res.status(403).json({ error: "Only agents can confirm requests" });
    }

    const agent = await Agent.findOne({ userId: _id });
    if (!agent) return res.status(403).json({ error: "No agent profile linked to this account" });

    const request = await MaintenanceRequest.findById(id);
    if (!request) return res.status(404).json({ error: "Maintenance request not found" });
    if (!request.assignedAgentId || request.assignedAgentId.toString() !== agent._id.toString()) {
      return res.status(403).json({ error: "This request is not assigned to you" });
    }
    if (request.status !== "assigned_pending") {
      return res.status(400).json({ error: "Request is not pending your confirmation" });
    }

    request.status = "assigned";
    await request.save();
    agent.availability = "busy";
    agent.totalJobs = (agent.totalJobs || 0) + 1;
    await agent.save();

    await request.populate([
      { path: "tenantId", select: "firstName lastName email phone", populate: { path: "userId", select: "userName email" } },
      { path: "propertyId", select: "propertyName address city state" },
      { path: "landlordId", select: "userName email" },
      { path: "assignedAgentId", select: "name email phone availability" },
    ]);

    res.status(200).json({ message: "Request accepted. You are now assigned.", data: request });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Agent rejects a maintenance request (removes assignment)
 * PATCH /maintenance/:id/agent-reject
 */
const agentRejectRequest = async (req, res) => {
  try {
    const { _id } = req.user;
    const { id } = req.params;

    if (!_id) return res.status(401).json({ error: "Unauthorized" });
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Valid request ID is required" });
    }

    const user = await Auth.findById(_id);
    if (!user || user.isAgent !== true) {
      return res.status(403).json({ error: "Only agents can reject assignments" });
    }

    const agent = await Agent.findOne({ userId: _id });
    if (!agent) return res.status(403).json({ error: "No agent profile linked to this account" });

    const request = await MaintenanceRequest.findById(id);
    if (!request) return res.status(404).json({ error: "Maintenance request not found" });
    if (!request.assignedAgentId || request.assignedAgentId.toString() !== agent._id.toString()) {
      return res.status(403).json({ error: "This request is not assigned to you" });
    }
    if (request.status !== "assigned_pending") {
      return res.status(400).json({ error: "Request is not pending your confirmation" });
    }

    request.assignedAgentId = null;
    request.status = "accepted";
    await request.save();

    await request.populate([
      { path: "tenantId", select: "firstName lastName email phone", populate: { path: "userId", select: "userName email" } },
      { path: "propertyId", select: "propertyName address city state" },
      { path: "landlordId", select: "userName email" },
    ]);

    res.status(200).json({ message: "Assignment rejected. Landlord can assign another agent.", data: request });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
};



const getAssignedAgentMaintenanceRequests = async (req, res) => {
  try {
    const { _id } = req.user;
    if (!_id) return res.status(401).json({ error: "Unauthorized" });

    const user = await Auth.findById(_id);
    if (!user || user.isAgent !== true) {
      return res.status(403).json({ error: "Only agents can access this endpoint" });
    }

    const agent = await Agent.findOne({ email: user?.email });
    if (!agent) {
      return res.status(200).json({ data: [], message: "No agent profile linked to this account" });
    }

    const requests = await MaintenanceRequest.find({ assignedAgentId: agent._id, status: "assigned" })
      .populate([
        { path: "propertyId", select: "propertyName address city state" },
        { path: "tenantId", select: "firstName lastName email phone moveInDate", populate: { path: "userId", select: "userName email" } },
        { path: "landlordId", select: "userName email" },
           { path: "assignedAgentId"},
      ])
      .sort({ createdAt: -1 });

    res.status(200).json({ data: requests });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  createMaintenanceRequest,
  getTenantMaintenanceRequests,
  getLandlordMaintenanceRequests,
  updateMaintenanceRequestStatus,
  getMaintenanceRequestById,
  acceptRequest,
  rejectRequest,
  assignAgent,
  getAgentMaintenanceRequests,
  agentAcceptRequest,
  agentRejectRequest,
  getAssignedAgentMaintenanceRequests
};
