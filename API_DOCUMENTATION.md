# API Documentation

## Overview

This document provides comprehensive API documentation for the Tenant, Maintenance Request, and Agent systems.

---

## Table of Contents

1. [Tenant System](#tenant-system)
2. [Maintenance Request System](#maintenance-request-system)
3. [Agent System](#agent-system)
4. [Database Schemas](#database-schemas)
5. [Indexes and Validation](#indexes-and-validation)
6. [Best Practices](#best-practices)

---

## Tenant System

### Auto-Creation Flow

When a landlord approves an application (changes status to "success"), a Tenant record is automatically created.

### Update Application Status

**Endpoint:** `PATCH /api/application/:applicationId/status`

**Authentication:** Required (Landlord only)

**Request Body:**
```json
{
  "status": "success"
}
```

**Response (Success - 200):**
```json
{
  "message": "Application approved and tenant created successfully",
  "data": {
    "application": {
      "_id": "507f1f77bcf86cd799439011",
      "propertyId": "507f1f77bcf86cd799439012",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "status": "success",
      ...
    },
    "tenant": {
      "_id": "507f1f77bcf86cd799439013",
      "applicationId": "507f1f77bcf86cd799439011",
      "propertyId": "507f1f77bcf86cd799439012",
      "userId": "507f1f77bcf86cd799439014",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+1234567890",
      "moveInDate": "2024-03-01T00:00:00.000Z",
      "status": "active",
      "createdAt": "2024-02-15T10:30:00.000Z",
      "updatedAt": "2024-02-15T10:30:00.000Z"
    }
  }
}
```

**Error Responses:**
- `400`: Property already has a tenant
- `401`: Unauthorized
- `403`: Not authorized to update this application
- `404`: Application not found

---

## Maintenance Request System

### 1. Create Maintenance Request

**Endpoint:** `POST /api/maintenance-request`

**Authentication:** Required (Tenant only)

**Request Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
```
title: "Leaky faucet in kitchen"
description: "The kitchen faucet has been leaking for the past week. Water is dripping constantly."
priority: "medium"
propertyId: "507f1f77bcf86cd799439012"
images: [file1, file2] (optional)
```

**Response (Success - 201):**
```json
{
  "message": "Maintenance request created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439015",
    "tenantId": {
      "_id": "507f1f77bcf86cd799439013",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phone": "+1234567890"
    },
    "landlordId": "507f1f77bcf86cd799439016",
    "propertyId": {
      "_id": "507f1f77bcf86cd799439012",
      "propertyName": "Sunset Apartments",
      "address": "123 Main St"
    },
    "title": "Leaky faucet in kitchen",
    "description": "The kitchen faucet has been leaking for the past week...",
    "status": "pending",
    "priority": "medium",
    "images": [
      {
        "url": "https://cloudinary.com/image1.jpg",
        "public_id": "image1_id"
      }
    ],
    "assignedAgentId": null,
    "createdAt": "2024-02-15T11:00:00.000Z",
    "updatedAt": "2024-02-15T11:00:00.000Z"
  }
}
```

**Error Responses:**
- `400`: Title and description are required
- `401`: Unauthorized
- `403`: Only tenants can create maintenance requests / Not assigned to this property
- `404`: Property not found

---

### 2. Get Tenant's Maintenance Requests

**Endpoint:** `GET /api/maintenance-request/tenant`

**Authentication:** Required (Tenant only)

**Response (Success - 200):**
```json
{
  "data": [
    {
      "_id": "507f1f77bcf86cd799439015",
      "propertyId": {
        "_id": "507f1f77bcf86cd799439012",
        "propertyName": "Sunset Apartments",
        "address": "123 Main St",
        "city": "New York",
        "state": "NY"
      },
      "title": "Leaky faucet in kitchen",
      "description": "The kitchen faucet has been leaking...",
      "status": "pending",
      "priority": "medium",
      "assignedAgentId": null,
      "createdAt": "2024-02-15T11:00:00.000Z"
    }
  ]
}
```

---

### 3. Get Landlord's Maintenance Requests

**Endpoint:** `GET /api/maintenance-request/landlord`

**Authentication:** Required (Landlord only)

**Response (Success - 200):**
```json
{
  "data": [
    {
      "_id": "507f1f77bcf86cd799439015",
      "tenantId": {
        "_id": "507f1f77bcf86cd799439013",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com",
        "phone": "+1234567890",
        "moveInDate": "2024-03-01T00:00:00.000Z",
        "userId": {
          "_id": "507f1f77bcf86cd799439014",
          "userName": "johndoe",
          "email": "john.doe@example.com"
        }
      },
      "propertyId": {
        "_id": "507f1f77bcf86cd799439012",
        "propertyName": "Sunset Apartments",
        "address": "123 Main St",
        "city": "New York",
        "state": "NY"
      },
      "title": "Leaky faucet in kitchen",
      "description": "The kitchen faucet has been leaking...",
      "status": "accepted",
      "priority": "medium",
      "assignedAgentId": {
        "_id": "507f1f77bcf86cd799439017",
        "name": "Mike Johnson",
        "email": "mike@plumbing.com",
        "phone": "+1987654321",
        "availability": "busy",
        "company": "Johnson Plumbing"
      },
      "createdAt": "2024-02-15T11:00:00.000Z"
    }
  ]
}
```

---

### 4. Get Single Maintenance Request

**Endpoint:** `GET /api/maintenance-request/:requestId`

**Authentication:** Required (Tenant or Landlord)

**Response (Success - 200):**
```json
{
  "data": {
    "_id": "507f1f77bcf86cd799439015",
    "tenantId": {
      "_id": "507f1f77bcf86cd799439013",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phone": "+1234567890",
      "moveInDate": "2024-03-01T00:00:00.000Z",
      "userId": {
        "_id": "507f1f77bcf86cd799439014",
        "userName": "johndoe",
        "email": "john.doe@example.com"
      }
    },
    "propertyId": {
      "_id": "507f1f77bcf86cd799439012",
      "propertyName": "Sunset Apartments",
      "address": "123 Main St",
      "city": "New York",
      "state": "NY"
    },
    "title": "Leaky faucet in kitchen",
    "description": "The kitchen faucet has been leaking...",
    "status": "assigned",
    "priority": "medium",
    "assignedAgentId": {
      "_id": "507f1f77bcf86cd799439017",
      "name": "Mike Johnson",
      "email": "mike@plumbing.com",
      "phone": "+1987654321",
      "availability": "busy",
      "company": "Johnson Plumbing",
      "specialization": ["plumbing", "repairs"]
    },
    "images": [...],
    "createdAt": "2024-02-15T11:00:00.000Z",
    "updatedAt": "2024-02-15T12:00:00.000Z"
  }
}
```

---

### 5. Update Maintenance Request Status

**Endpoint:** `PATCH /api/maintenance-request/:requestId/status`

**Authentication:** Required (Landlord only)

**Request Body:**
```json
{
  "status": "accepted",
  "notes": "Will schedule repair for next week"
}
```

**Status Options:** `pending`, `accepted`, `rejected`, `assigned`, `completed`

**Response (Success - 200):**
```json
{
  "message": "Maintenance request status updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439015",
    "status": "accepted",
    "notes": "Will schedule repair for next week",
    ...
  }
}
```

---

## Agent System

### 1. Create Agent

**Endpoint:** `POST /api/agent`

**Authentication:** Not required (can be made required if needed)

**Request Body:**
```json
{
  "name": "Mike Johnson",
  "email": "mike@plumbing.com",
  "phone": "+1987654321",
  "availability": "available",
  "specialization": ["plumbing", "repairs"],
  "company": "Johnson Plumbing",
  "address": "456 Service St, New York, NY"
}
```

**Response (Success - 201):**
```json
{
  "message": "Agent created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439017",
    "name": "Mike Johnson",
    "email": "mike@plumbing.com",
    "phone": "+1987654321",
    "availability": "available",
    "specialization": ["plumbing", "repairs"],
    "company": "Johnson Plumbing",
    "address": "456 Service St, New York, NY",
    "status": "active",
    "rating": 0,
    "totalJobs": 0,
    "createdAt": "2024-02-15T10:00:00.000Z",
    "updatedAt": "2024-02-15T10:00:00.000Z"
  }
}
```

---

### 2. Get All Agents

**Endpoint:** `GET /api/agent`

**Query Parameters:**
- `availability`: Filter by availability (`available`, `busy`, `unavailable`)
- `status`: Filter by status (`active`, `inactive`)

**Example:** `GET /api/agent?availability=available&status=active`

**Response (Success - 200):**
```json
{
  "data": [
    {
      "_id": "507f1f77bcf86cd799439017",
      "name": "Mike Johnson",
      "email": "mike@plumbing.com",
      "phone": "+1987654321",
      "availability": "available",
      "specialization": ["plumbing", "repairs"],
      "company": "Johnson Plumbing",
      "status": "active",
      "rating": 4.5,
      "totalJobs": 25
    }
  ]
}
```

---

### 3. Get Agent by ID

**Endpoint:** `GET /api/agent/:agentId`

**Response (Success - 200):**
```json
{
  "data": {
    "_id": "507f1f77bcf86cd799439017",
    "name": "Mike Johnson",
    "email": "mike@plumbing.com",
    "phone": "+1987654321",
    "availability": "available",
    "specialization": ["plumbing", "repairs"],
    "company": "Johnson Plumbing",
    "address": "456 Service St, New York, NY",
    "status": "active",
    "rating": 4.5,
    "totalJobs": 25,
    "createdAt": "2024-02-15T10:00:00.000Z",
    "updatedAt": "2024-02-15T10:00:00.000Z"
  }
}
```

---

### 4. Assign Agent to Maintenance Request

**Endpoint:** `POST /api/agent/assign`

**Authentication:** Required (Landlord only)

**Request Body:**
```json
{
  "maintenanceRequestId": "507f1f77bcf86cd799439015",
  "agentId": "507f1f77bcf86cd799439017"
}
```

**Response (Success - 200):**
```json
{
  "message": "Agent assigned successfully. Email notification sent.",
  "emailSent": true,
  "data": {
    "_id": "507f1f77bcf86cd799439015",
    "status": "assigned",
    "assignedAgentId": {
      "_id": "507f1f77bcf86cd799439017",
      "name": "Mike Johnson",
      "email": "mike@plumbing.com",
      "phone": "+1987654321",
      "availability": "busy",
      "company": "Johnson Plumbing"
    },
    ...
  }
}
```

**Note:** An email is automatically sent to the agent when assigned.

---

### 5. Agent Confirm/Reject Availability

**Endpoint:** `PATCH /api/agent/:agentId/availability/:requestId`

**Authentication:** Not required (agent can confirm via email link or API)

**Request Body:**
```json
{
  "confirm": true
}
```

**Response (Success - 200) - Confirmed:**
```json
{
  "message": "Availability confirmed. You are now assigned to this request.",
  "data": {
    "_id": "507f1f77bcf86cd799439015",
    "status": "assigned",
    "assignedAgentId": {
      "_id": "507f1f77bcf86cd799439017",
      "name": "Mike Johnson",
      "email": "mike@plumbing.com",
      "phone": "+1987654321",
      "availability": "busy"
    },
    ...
  }
}
```

**Response (Success - 200) - Rejected:**
```json
{
  "message": "Availability rejected. Agent assignment removed.",
  "data": {
    "_id": "507f1f77bcf86cd799439015",
    "status": "accepted",
    "assignedAgentId": null,
    ...
  }
}
```

---

### 6. Update Agent

**Endpoint:** `PATCH /api/agent/:agentId`

**Request Body:**
```json
{
  "availability": "busy",
  "phone": "+1987654322",
  "specialization": ["plumbing", "repairs", "electrical"]
}
```

**Response (Success - 200):**
```json
{
  "message": "Agent updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439017",
    "availability": "busy",
    "phone": "+1987654322",
    "specialization": ["plumbing", "repairs", "electrical"],
    ...
  }
}
```

---

## Database Schemas

### Tenant Schema

```javascript
{
  applicationId: ObjectId (ref: Applications, unique, required),
  propertyId: ObjectId (ref: Property, unique, required),
  userId: ObjectId (ref: Auth, required),
  email: String (required),
  firstName: String (required),
  lastName: String (required),
  phone: String (required),
  moveInDate: Date (required),
  status: String (enum: ["active", "inactive", "terminated"], default: "active"),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `propertyId` (unique) - Ensures one tenant per property
- `userId` - For efficient tenant queries
- `applicationId` (unique) - Links to application

---

### MaintenanceRequest Schema

```javascript
{
  tenantId: ObjectId (ref: Tenant, required),
  landlordId: ObjectId (ref: Auth, required),
  propertyId: ObjectId (ref: Property, required),
  title: String (required, maxlength: 200),
  description: String (required),
  status: String (enum: ["pending", "accepted", "rejected", "assigned", "completed"], default: "pending"),
  assignedAgentId: ObjectId (ref: Agent, default: null),
  images: [{
    url: String,
    public_id: String
  }],
  priority: String (enum: ["low", "medium", "high", "urgent"], default: "medium"),
  estimatedCost: Number (default: null),
  completedAt: Date (default: null),
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `tenantId` - For tenant queries
- `landlordId` - For landlord queries
- `propertyId` - For property queries
- `status` - For status filtering
- `assignedAgentId` - For agent queries
- `createdAt` (descending) - For sorting

---

### Agent Schema

```javascript
{
  name: String (required),
  email: String (required, unique, validated),
  phone: String (required),
  availability: String (enum: ["available", "busy", "unavailable"], default: "available"),
  specialization: [String] (default: []),
  company: String,
  address: String,
  status: String (enum: ["active", "inactive"], default: "active"),
  rating: Number (min: 0, max: 5, default: 0),
  totalJobs: Number (default: 0),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `email` (unique) - For email lookups
- `availability` - For filtering available agents
- `status` - For filtering active agents

---

## Indexes and Validation

### Key Indexes

1. **Tenant Model:**
   - Unique index on `propertyId` - Enforces one tenant per property
   - Index on `userId` - Fast tenant lookups by user
   - Unique index on `applicationId` - Links tenant to application

2. **MaintenanceRequest Model:**
   - Indexes on `tenantId`, `landlordId`, `propertyId` - Fast filtering
   - Index on `status` - Efficient status queries
   - Index on `assignedAgentId` - Agent assignment queries
   - Descending index on `createdAt` - Recent requests first

3. **Agent Model:**
   - Unique index on `email` - Prevents duplicates
   - Index on `availability` - Filter available agents
   - Index on `status` - Filter active agents

### Validation Rules

1. **One Tenant Per Property:** Enforced by unique index on `propertyId` in Tenant schema
2. **Email Validation:** Regex validation on email fields
3. **Status Enums:** All status fields use enum validation
4. **Required Fields:** Critical fields marked as required
5. **Date Validation:** Move-in date validation in Application schema

---

## Best Practices

### 1. Error Handling

- All endpoints return consistent error formats
- Validation errors are returned with detailed messages
- 401 for unauthorized, 403 for forbidden, 404 for not found
- 500 for server errors with generic messages (don't expose internals)

### 2. Authentication & Authorization

- Use JWT tokens via `requireAuth` middleware
- Verify user roles (tenant/landlord) before operations
- Verify ownership (landlord owns property, tenant assigned to property)

### 3. Data Population

- Use Mongoose `.populate()` for related data
- Only populate necessary fields using `select`
- Avoid deep nesting in responses

### 4. File Uploads

- Use Cloudinary for image/document storage
- Validate file types and sizes
- Store both URL and public_id for management

### 5. Email Notifications

- Email service gracefully handles missing nodemailer
- Log emails in development mode
- Configure SMTP in production via environment variables

### 6. Transaction Safety

- Check for existing tenants before creating new ones
- Verify application status before tenant creation
- Use unique indexes to prevent race conditions

### 7. Query Optimization

- Use indexes for frequently queried fields
- Limit population depth
- Sort by `createdAt` descending for recent-first ordering

### 8. Environment Variables

Add to `.env`:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@landlordship.com
```

---

## Installation Notes

### Required Packages

```bash
npm install nodemailer  # For email functionality (optional)
```

### Database Setup

MongoDB indexes are automatically created when models are first used. Ensure MongoDB connection is configured in `.env`:

```
MONGODB_URL=your-mongodb-connection-string
```

---

## Status Flow

### Maintenance Request Status Flow

```
pending → accepted → assigned → completed
         ↓
      rejected
```

### Agent Assignment Flow

1. Landlord accepts maintenance request (`status: "accepted"`)
2. Landlord assigns agent (`status: "assigned"`, email sent)
3. Agent confirms/rejects availability
   - **Confirm:** Status remains `assigned`, agent availability → `busy`
   - **Reject:** Status → `accepted`, `assignedAgentId` → `null`

---

## Testing Recommendations

1. Test tenant creation when application is approved
2. Test one-tenant-per-property enforcement
3. Test maintenance request creation by tenants only
4. Test landlord authorization for status updates
5. Test agent assignment and confirmation flow
6. Test email notifications (mock in tests)

---

## Future Enhancements

- Add pagination to list endpoints
- Add filtering and sorting options
- Add agent rating system
- Add maintenance request comments/updates
- Add scheduled maintenance requests
- Add cost tracking and invoicing
- Add notification system (in-app + email)
