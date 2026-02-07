# Maintenance + Agent Assignment Workflow

## Overview

Role-based dashboards and API for **Landlord**, **Tenant**, and **Agent** with maintenance request flow, agent assignment, email + in-app notifications.

---

## Schemas

### MaintenanceRequest

- `tenantId` (ref: Tenant), `landlordId` (ref: Auth), `propertyId` (ref: Property)
- `assignedAgentId` (ref: Agent, nullable)
- `title`, `description`, `status`, timestamps
- **Status enum:** `"pending"` | `"accepted"` | `"rejected"` | `"assigned_pending"` | `"assigned"` | `"completed"`
- Initial status when tenant creates: `"pending"`

### Agent

- `userId` (ref: Auth, optional) – links agent to Auth when they use the dashboard
- `name`, `email`, `phone`, `availability`, `specialization`, `company`, `address`, `status`, `rating`, `totalJobs`
- Agents with `userId` set can use GET `/api/maintenance/agent` and accept/reject via API.

### Auth

- **Landlord is implicit** (no flag needed)
- `isTenant: Boolean` (default `false`) – enables tenant dashboard/capability
- `isAgent: Boolean` (default `false`) – enables agent dashboard/capability

### Notification

- `recipientId` (ref: Auth), `type`, `title`, `message`, `maintenanceRequestId`, `read`, `metadata`
- Created when a landlord assigns an agent (if agent has `userId`).

---

## API Endpoints

Base URL for maintenance: **`/api/maintenance`**. All maintenance endpoints use `requireAuth` unless noted.

### Tenant

| Method | Path | Description |
|--------|------|-------------|
| POST   | `/api/maintenance`            | Create maintenance request (body: `title`, `description`, `propertyId`; optional `priority`, `images`) |
| GET    | `/api/maintenance/my`         | List all requests created by this tenant |
| GET    | `/api/maintenance/:id`        | Get one request (if tenant/landlord/assigned agent) |

### Landlord

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/maintenance/landlord`   | List all requests for landlord’s properties |
| PATCH  | `/api/maintenance/:id/accept` | Accept request → status `"accepted"` |
| PATCH  | `/api/maintenance/:id/reject` | Reject request → status `"rejected"` |
| POST   | `/api/maintenance/:id/assign-agent` | Assign agent (body: `{ "agentId": "..." }`) → status `"assigned_pending"`, send email + in-app notification |
| GET    | `/api/maintenance/:id`       | Get one request (if landlord owns the property) |

Only requests with status `"accepted"` can be assigned to an agent.

### Agent

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/maintenance/agent`     | List all requests assigned to this agent (pending + active) |
| PATCH  | `/api/maintenance/:id/agent-accept` | Accept assignment → status `"assigned"` |
| PATCH  | `/api/maintenance/:id/agent-reject` | Reject assignment → clear `assignedAgentId`, status `"accepted"` |
| GET    | `/api/maintenance/:id`       | Get one request (if assigned to this agent) |

Agents must have an **Agent** document with `userId` set to their Auth `_id` to use these endpoints.  
Use **`POST /api/agent/profile`** (auth, role `"agent"`) to create/update that profile.

### Notifications (in-app)

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/notifications`          | List notifications for current user (`?read=true|false`, `?limit=50`) |
| PATCH  | `/api/notifications/:id/read` | Mark notification as read |

---

## Flow Summary

1. **Tenant** creates request → status `"pending"`.
2. **Landlord** accepts → `"accepted"` or rejects → `"rejected"`.
3. **Landlord** assigns agent (only when `"accepted"`) → status `"assigned_pending"`, `assignedAgentId` set, email + in-app notification (if agent has `userId`).
4. **Agent** accepts → status `"assigned"`, or rejects → `assignedAgentId` cleared, status back to `"accepted"` (landlord can assign another agent).
5. **Landlord** can later set status to `"completed"` (e.g. via existing status-update logic or a dedicated PATCH; extend as needed).

---

## Role Resolution

Controllers now use **capability flags**:

- Tenant-only endpoints require `user.isTenant === true`
- Agent-only endpoints require `user.isAgent === true`
- Landlord endpoints are allowed for any authenticated user, but always scoped by ownership checks (e.g. `landlordId === req.user._id`)

---

## Agent Dashboard Setup

1. User signs up / logs in with **Auth** and `role: "agent"`.
2. User calls **`POST /api/agent/profile`** with `{ "name", "email", "phone", ... }` → creates/updates **Agent** with `userId = req.user._id`.
3. From then on, **`GET /api/maintenance/agent`** and **`PATCH .../agent-accept`** / **`PATCH .../agent-reject`** work for that user.
4. When a landlord assigns this agent, they get email (from `utils/emailService`) and an in-app **Notification** (if `agent.userId` is set).

---

## Files Touched / Added

- **Models:** `maintenanceRequestModel.js` (status enum), `agentModel.js` (`userId`), `authModel.js` (`role`), `notificationModel.js` (new).
- **Controllers:** `maintenanceRequest.js` (accept, reject, assignAgent, getAgentMaintenanceRequests, agentAccept, agentReject; role resolution and agent access for `getMaintenanceRequestById`), `agent.js` (`createOrUpdateAgentProfile`), `notification.js` (new).
- **Routes:** `maintenanceRoute.js` (new, mounted at `/api/maintenance`), `notificationRoute.js` (new, mounted at `/api/notifications`), `agentRoute.js` (`POST /profile`).
- **Server:** `server.js` – registered `/api/maintenance` and `/api/notifications`.

---

## Example Requests

**Tenant – create request**

```http
POST /api/maintenance
Authorization: Bearer <token>
Content-Type: application/json

{ "title": "Leak in kitchen", "description": "...", "propertyId": "<propertyId>" }
```

**Landlord – accept**

```http
PATCH /api/maintenance/<requestId>/accept
Authorization: Bearer <token>
```

**Landlord – assign agent**

```http
POST /api/maintenance/<requestId>/assign-agent
Authorization: Bearer <token>
Content-Type: application/json

{ "agentId": "<agentId>" }
```

**Agent – list my requests**

```http
GET /api/maintenance/agent
Authorization: Bearer <token>
```

**Agent – accept assignment**

```http
PATCH /api/maintenance/<requestId>/agent-accept
Authorization: Bearer <token>
```

**Agent – reject assignment**

```http
PATCH /api/maintenance/<requestId>/agent-reject
Authorization: Bearer <token>
```

**Agent – create/link profile**

```http
POST /api/agent/profile
Authorization: Bearer <token>
Content-Type: application/json

{ "name": "Jane Agent", "email": "jane@example.com", "phone": "+1234567890" }
```

**Get my notifications**

```http
GET /api/notifications?read=false
Authorization: Bearer <token>
```
