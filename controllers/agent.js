const Agent = require("../models/agentModel");
const MaintenanceRequest = require("../models/maintenanceRequestModel");
const Property = require("../models/propertyModel");
const Auth = require("../models/authModel");
const mongoose = require("mongoose");
const { sendAgentAssignmentEmail } = require("../utils/emailService");
const Notification = require("../models/notificationModel")

const {pushNotification} = require("../services/websocket/pushNotification")
/**
 * Create a new agent
 * POST /api/agent
 */
const { getIO } = require("../services/globalServer");



const createAgent = async (req, res) => {
  try {
    const io = getIO();
    const { name, email, phone, availability, specialization, company, address } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({ 
        error: "Name, email, and phone are required" 
      });
    }
    const user = await Auth.findOne({ email })
    if (!user) {
       return res.status(400).json({
        error:"User not found",
      });
    }
    const agent = await Agent.create({
      name,
      landlordId : req.user._id,
      email,
      phone,
      availability: availability || "available",
      specialization: specialization || [],
      company,
      address,
    });

    res.status(201).json({
      message: "Agent created successfully",
      data: agent,
    });
  } catch (error) {
    console.log(error);
    
    if (error?.name === "ValidationError") {
      return res.status(400).json({
        error: Object.values(error?.errors).map((err) => err?.message),
      });
    }

    if (error?.code === 11000) {
      return res.status(400).json({ 
        error: "Agent with this email already exists" 
      });
    }

    return res.status(500).json({ error: "Server error" });
  }
};

/**
 * Authenticated agent creates/updates their profile (links Agent to Auth).
 * POST /api/agent/profile
 */
const createOrUpdateAgentProfile = async (req, res) => {
  try {
    const { _id } = req.user;
    if (!_id) return res.status(401).json({ error: "Unauthorized" });

    const user = await Auth.findById(_id);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    // Enable agent dashboard capability on this account
    if (user.isAgent !== true) {
      user.isAgent = true;
      await user.save();
    }

    const { name, email, phone, availability, specialization, company, address } = req.body;
    if (!name || !email || !phone) {
      return res.status(400).json({ error: "Name, email, and phone are required" });
    }

    let agent = await Agent.findOne({ userId: _id });
    if (agent) {
      agent.name = name;
      agent.email = email;
      agent.phone = phone;
      if (availability) agent.availability = availability;
      if (specialization) agent.specialization = specialization;
      if (company !== undefined) agent.company = company;
      if (address !== undefined) agent.address = address;
      await agent.save();
      return res.status(200).json({ message: "Agent profile updated", data: agent });
    }

    agent = await Agent.create({
      userId: _id,
      name,
      email,
      phone,
      availability: availability || "available",
      specialization: specialization || [],
      company,
      address,
    });
    return res.status(201).json({ message: "Agent profile created", data: agent });
  } catch (err) {
    console.log(err);
    if (err?.code === 11000) return res.status(400).json({ error: "Agent with this email already exists" });
    return res.status(500).json({ error: "Server error" });
  }
};

/**
 * Get all agents
 * GET /api/agent
 */
const getAllAgents = async (req, res) => {
  try {
    const { _id } = req.user
    if (!_id) {
       return res.status(401).json({ error: "Unauthorized" });
    }

     const user = await Auth.findById(_id);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    


  

    const agents = await Agent.find({landlordId: _id}).sort({ createdAt: -1 });

    res.status(200).json({
      data: agents,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Server error" });
  }
};

/**
 * Get a single agent by ID
 * GET /api/agent/:agentId
 */
const getAgentById = async (req, res) => {
  try {
    const { agentId } = req.params;
const { _id } = req.user
    if (!_id) {
       return res.status(401).json({ error: "Unauthorized" });
    }
  if (!agentId || !mongoose.Types.ObjectId.isValid(agentId)) {
      return res.status(400).json({ error: "Valid agent ID is required" });
    }
     const user = await Auth.findById(_id);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  

    const agent = await Agent.findOne({landlordId: _id, _id : agentId});

    if (!agent) {
      return res.status(404).json({ error: "Agent not found" });
    }

    res.status(200).json({
      data: agent,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Server error" });
  }
};

/**
 * Landlord assigns an agent to a maintenance request
 * POST /api/agent/assign
 */
const assignAgentToMaintenanceRequest = async (req, res) => {
  try {
    const { _id } = req.user;
    const { maintenanceRequestId, agentId } = req.body;

    if (!_id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!maintenanceRequestId || !agentId) {
      return res.status(400).json({ 
        error: "Maintenance request ID and agent ID are required" 
      });
    }

    if (!mongoose.Types.ObjectId.isValid(maintenanceRequestId) || 
        !mongoose.Types.ObjectId.isValid(agentId)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    // Landlord is implicit, but must own the request (checked below)
    const user = await Auth.findById(_id);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Find the maintenance request
    const maintenanceRequest = await MaintenanceRequest.findById(maintenanceRequestId);

    if (!maintenanceRequest) {
      return res.status(404).json({ error: "Maintenance request not found" });
    }

    // Verify landlord owns the property
    if (maintenanceRequest.landlordId.toString() !== _id.toString()) {
      return res.status(403).json({ 
        error: "You are not authorized to assign agents to this request" 
      });
    }

    // Verify request is accepted
    if (maintenanceRequest.status !== "accepted") {
      return res.status(400).json({ 
        error: "Maintenance request must be accepted before assigning an agent" 
      });
    }

    // Find the agent
    const agent = await Agent.findById(agentId);

    if (!agent) {
      return res.status(404).json({ error: "Agent not found" });
    }

    if (agent.status !== "active") {
      return res.status(400).json({ 
        error: "Agent is not active" 
      });
    }

    // Update maintenance request
    maintenanceRequest.assignedAgentId = agentId;
    maintenanceRequest.status = "assigned";
    await maintenanceRequest.save();

    // Send email to agent
    const emailResult = await sendAgentAssignmentEmail(
      agent.email,
      agent.name,
      maintenanceRequest
    );

   
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
        select: "name email phone availability company" 
      },
    ]);
    const payload = await Notification.create({
      recipientId : agent._id,
      title : "New Maintenance Request Assigned to you",
      message : "You have been assigned to a new maintenance request. Please confirm or reject your availability for this request.",
      metadata : {
        maintenanceRequestId:maintenanceRequest._id,
        propertyId : maintenanceRequest.propertyId,
        tenantId:maintenanceRequest.tenantId,
        landlordId:maintenanceRequest.landlordId,
        agentId:agent._id,
      
      },
      type : "maintenance_assignment",
      maintenanceRequestId: maintenanceRequest._id,
      read:false



    })
    
     await pushNotification(io, agent._id.toString(), payload);
    res.status(200).json({
      message: "Agent assigned successfully. Email notification sent.",
      data: maintenanceRequest,
      emailSent: emailResult.success,
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
 * Agent confirms or rejects availability for a maintenance request
 * PATCH /api/agent/:agentId/availability/:requestId
 */
const agentConfirmAvailability = async (req, res) => {
  try {
    const { agentId, requestId } = req.params;
    const { confirm } = req.body; // true to confirm, false to reject

    if (!agentId || !requestId) {
      return res.status(400).json({ 
        error: "Agent ID and request ID are required" 
      });
    }

    if (!mongoose.Types.ObjectId.isValid(agentId) || 
        !mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    if (typeof confirm !== "boolean") {
      return res.status(400).json({ 
        error: "Confirm field is required and must be a boolean" 
      });
    }

    // Find the agent
    const agent = await Agent.findById(agentId);

    if (!agent) {
      return res.status(404).json({ error: "Agent not found" });
    }

    // Find the maintenance request
    const maintenanceRequest = await MaintenanceRequest.findById(requestId);

    if (!maintenanceRequest) {
      return res.status(404).json({ error: "Maintenance request not found" });
    }

    // Verify agent is assigned to this request
    if (maintenanceRequest.assignedAgentId.toString() !== agentId) {
      return res.status(403).json({ 
        error: "You are not assigned to this maintenance request" 
      });
    }

    if (confirm) {
      // Agent confirms availability
      maintenanceRequest.status = "assigned";
      agent.availability = "busy";
      agent.totalJobs = (agent.totalJobs || 0) + 1;
      
      await Promise.all([
        maintenanceRequest.save(),
        agent.save(),
      ]);

      // Populate related data
      await maintenanceRequest.populate([
        { 
          path: "tenantId", 
          select: "firstName lastName email phone",
        },
        { path: "propertyId", select: "propertyName address" },
        { 
          path: "assignedAgentId", 
          select: "name email phone availability" 
        },
      ]);

      res.status(200).json({
        message: "Availability confirmed. You are now assigned to this request.",
        data: maintenanceRequest,
      });
    } else {
      // Agent rejects availability
      maintenanceRequest.assignedAgentId = null;
      maintenanceRequest.status = "accepted"; // Revert to accepted status
      agent.availability = "available";
      
      await Promise.all([
        maintenanceRequest.save(),
        agent.save(),
      ]);

      res.status(200).json({
        message: "Availability rejected. Agent assignment removed.",
        data: maintenanceRequest,
      });
    }
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
 * Update agent information
 * PATCH /api/agent/:agentId
 */
const updateAgent = async (req, res) => {
  try {
    const { agentId } = req.params;
    const { name, email, phone, availability, specialization, company, address, status } = req.body;

    if (!agentId || !mongoose.Types.ObjectId.isValid(agentId)) {
      return res.status(400).json({ error: "Valid agent ID is required" });
    }

    const agent = await Agent.findById(agentId);

    if (!agent) {
      return res.status(404).json({ error: "Agent not found" });
    }

    // Update fields
    if (name) agent.name = name;
    if (email) agent.email = email;
    if (phone) agent.phone = phone;
    if (availability) agent.availability = availability;
    if (specialization) agent.specialization = specialization;
    if (company !== undefined) agent.company = company;
    if (address !== undefined) agent.address = address;
    if (status) agent.status = status;

    await agent.save();

    res.status(200).json({
      message: "Agent updated successfully",
      data: agent,
    });
  } catch (error) {
    console.log(error);
    
    if (error?.name === "ValidationError") {
      return res.status(400).json({
        error: Object.values(error?.errors).map((err) => err?.message),
      });
    }

    if (error?.code === 11000) {
      return res.status(400).json({ 
        error: "Agent with this email already exists" 
      });
    }

    return res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  createAgent,
  createOrUpdateAgentProfile,
  getAllAgents,
  getAgentById,
  assignAgentToMaintenanceRequest,
  agentConfirmAvailability,
  updateAgent,
};
