// Email service utility
// Note: Install nodemailer and configure SMTP settings in .env
// npm install nodemailer

let nodemailer;
try {
  nodemailer = require("nodemailer");
} catch (error) {
  console.log("nodemailer not installed. Email functionality will be mocked.");
}

require("dotenv").config();

// Create transporter (configure with your SMTP settings)
const createTransporter = () => {
  // If nodemailer is not installed, return mock transporter
  if (!nodemailer) {
    return {
      sendMail: async (options) => {
        console.log("📧 Email would be sent (nodemailer not installed):", {
          to: options.to,
          subject: options.subject,
          text: options.text,
        });
        return { messageId: "mock-message-id" };
      },
    };
  }

  // For development, you can use Ethereal Email or configure real SMTP
  // Example with Gmail (requires app password):
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  
  // Fallback: Log email instead of sending (for development)
  return {
    sendMail: async (options) => {
      console.log("📧 Email would be sent:", {
        to: options.to,
        subject: options.subject,
        text: options.text,
      });
      return { messageId: "mock-message-id" };
    },
  };
};

const transporter = createTransporter();

/**
 * Send email to agent about maintenance request assignment
 */
const sendAgentAssignmentEmail = async (agentEmail, agentName, maintenanceRequest) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM || "noreply@landlordship.com",
      to: agentEmail,
      subject: `New Maintenance Request Assignment - ${maintenanceRequest.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>New Maintenance Request Assignment</h2>
          <p>Hello ${agentName},</p>
          <p>You have been assigned to a new maintenance request:</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Title:</strong> ${maintenanceRequest.title}</p>
            <p><strong>Description:</strong> ${maintenanceRequest.description}</p>
            <p><strong>Priority:</strong> ${maintenanceRequest.priority || "medium"}</p>
            <p><strong>Request ID:</strong> ${maintenanceRequest._id}</p>
          </div>
          <p>Please confirm or reject your availability for this request.</p>
          <p>Best regards,<br>Landlordship Team</p>
        </div>
      `,
      text: `
        New Maintenance Request Assignment
        
        Hello ${agentName},
        
        You have been assigned to a new maintenance request:
        
        Title: ${maintenanceRequest.title}
        Description: ${maintenanceRequest.description}
        Priority: ${maintenanceRequest.priority || "medium"}
        Request ID: ${maintenanceRequest._id}
        
        Please confirm or reject your availability for this request.
        
        Best regards,
        Landlordship Team
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendAgentAssignmentEmail,
  transporter,
};
