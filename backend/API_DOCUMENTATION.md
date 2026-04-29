# PGDS Platform API Documentation

Complete API documentation for the PGDS (Product Gallery Design System) Platform backend services.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Authentication](#authentication)
3. [Error Handling](#error-handling)
4. [API Endpoints](#api-endpoints)
5. [Module Structure](#module-structure)

---

## Architecture Overview

### Project Structure

The API is organized into modular services following a clean architecture pattern:

```
backend/src/
├── index.js                 # Main Express server
├── middleware/
│   └── auth.js             # JWT authentication & authorization
├── routes/                 # Route definitions (thin layer - only routing)
│   ├── auth.js
│   ├── users.js
│   ├── requests.js
│   ├── research-requests.js
│   ├── components.js
│   ├── activity.js
│   ├── menu.js
│   └── data-master.js
├── controllers/            # Business logic (handlers for each module)
│   ├── authController.js
│   ├── usersController.js
│   ├── requestsController.js
│   ├── researchRequestsController.js
│   ├── componentsController.js
│   ├── activityController.js
│   ├── menuController.js
│   └── dataMasterController.js
├── services/              # Shared utilities
│   ├── parsers.js         # Data transformation functions
│   └── validators.js      # Input validation helpers
└── data/
    └── db.js              # Database layer
```

### Layer Responsibilities

- **Routes**: Define API endpoints and mount middleware
- **Controllers**: Handle business logic, validation, and data manipulation
- **Services**: Provide shared utilities (parsers, validators)
- **Middleware**: Handle cross-cutting concerns (auth, logging)
- **Data**: Manage database connections and queries

### Benefits

✅ **Maintainability**: Each module has clear, single responsibility  
✅ **Testability**: Controllers can be tested independently  
✅ **Reusability**: Services provide shared functions across controllers  
✅ **Scalability**: Easy to add new features or modules  
✅ **Code Organization**: Consistent structure across all modules

---

## Authentication

### JWT Tokens

The API uses JWT (JSON Web Tokens) for authentication. Tokens contain user information:

```json
{
  "id": "user-uuid",
  "role": "super_admin|designer|engineer|developer",
  "name": "User Name",
  "email": "user@example.com",
  "team": "Team Name"
}
```

### Token Validation

- Include token in `Authorization` header: `Authorization: Bearer <token>`
- Token is validated by the `authenticate` middleware
- Expired or invalid tokens return `401 Unauthorized`

### User Roles

- **super_admin**: Full system access, can override workflows
- **designer**: Can manage design work, request revisions, trigger audits
- **engineer**: Can develop components, publish work
- **developer**: Can submit requests, contribute to development

---

## Error Handling

### Standard Error Response

All error responses follow this format:

```json
{
  "error": "Human-readable error message"
}
```

### Common HTTP Status Codes

| Status | Meaning | Example |
|--------|---------|---------|
| 200 | Success | Data retrieved or operation completed |
| 201 | Created | New resource created |
| 400 | Bad Request | Invalid input parameters |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | User lacks required permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate unique constraint (email, slug) |
| 500 | Server Error | Unexpected server error |

---

## API Endpoints

### 1. Authentication `/api/auth`

#### POST /login
Login with credentials and receive JWT token.

**Request:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid-1",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "designer",
    "team": "Design Team",
    "status": "active"
  }
}
```

**Error Cases:**
- `400`: Email and password required
- `401`: Invalid credentials
- `403`: Account is inactive/suspended

---

#### GET /me
Get current authenticated user profile.

**Request:**
```bash
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer <token>"
```

**Response (200):**
```json
{
  "id": "uuid-1",
  "name": "John Doe",
  "email": "user@example.com",
  "role": "designer",
  "team": "Design Team",
  "phone": "+1-234-567-8900",
  "status": "active",
  "created_at": "2025-01-15T10:30:00.000Z",
  "last_active": "2025-01-17T14:22:00.000Z"
}
```

---

### 2. Users `/api/users`

**Auth Required**: All endpoints require authentication. Most require `super_admin` role.

#### GET /
Get all users (admin only).

**Response (200):**
```json
[
  {
    "id": "uuid-1",
    "name": "Jane Designer",
    "username": "jane.designer",
    "email": "jane@example.com",
    "role": "designer",
    "team": "Design Team",
    "phone": "+1-234-567-8900",
    "bio": "Lead designer",
    "status": "active",
    "created_at": "2025-01-15T10:30:00.000Z",
    "updated_at": "2025-01-17T14:22:00.000Z"
  }
]
```

---

#### GET /:id
Get single user by ID (admin only).

**Response (200):** User object (same format as above)

---

#### POST /
Create new user (admin only).

**Request:**
```json
{
  "name": "New User",
  "email": "newuser@example.com",
  "password": "SecurePass123",
  "role": "designer",
  "username": "new.user",
  "team": "Design Team",
  "phone": "+1-234-567-8900",
  "bio": "New team member",
  "status": "active"
}
```

**Validation Rules:**
- `name`, `email`, `password`, `role` are required
- `password` must be at least 8 characters
- `email` must be valid format
- `role` must be one of: `super_admin`, `designer`, `engineer`, `developer`
- `status` must be one of: `active`, `inactive`, `suspended`
- `email` and `username` must be unique

**Response (201):** Created user object

**Error Cases:**
- `400`: Validation failed
- `409`: Email or username already exists

---

#### PUT /:id
Update user (admin only).

**Request:**
```json
{
  "name": "Updated Name",
  "email": "updated@example.com",
  "username": "updated.user",
  "role": "engineer",
  "team": "Dev Team",
  "phone": "+1-234-567-8900",
  "status": "active",
  "bio": "Updated bio"
}
```

**Response (200):** Updated user object

---

#### PATCH /:id/status
Update user status only (admin only).

**Request:**
```json
{
  "status": "suspended"
}
```

**Response (200):**
```json
{
  "ok": true,
  "status": "suspended"
}
```

---

#### DELETE /:id
Delete user (admin only). Cannot delete yourself.

**Response (200):**
```json
{
  "ok": true
}
```

---

### 3. Requests `/api/requests`

**Auth Required**: All endpoints require authentication.

The requests API implements a complex state machine for managing component requests through designer and engineer workflows.

#### State Machine Workflows

**Designer Workflow:**
1. `need_design_validation` → approve_validation → backlog
2. `backlog` → start_design → in_design
3. `in_design` → finish_design → design_done
4. `design_done` → (engineer takes over)
5. `need_review_designer` → start_review → on_review_designer
6. `on_review_designer` → approve_review → done_review OR request_revision → need_revision
7. `need_revision` (engineer submits) → submit_revision → need_review_designer
8. `need_audit` → start_audit → on_audit
9. `on_audit` → audit_pass → need_development_update OR require_redesign → need_redesign
10. `need_redesign` → start_redesign → in_redesign
11. `in_redesign` → finish_redesign → redesign_done

**Engineer Workflow:**
1. `design_done`/`redesign_done`/`need_development_update` → start_dev → in_progress_code
2. `in_progress_code` → finish_dev → need_review_designer
3. `done_review`/`need_publish` → publish → done

---

#### GET /
Get all requests with workflow logs.

**Response (200):**
```json
[
  {
    "id": "req-uuid-1",
    "title": "New Dashboard Component",
    "requestType": "new_component",
    "requesterRole": "developer",
    "requesterName": "John Dev",
    "requesterTeam": "Dev Team",
    "requesterId": "user-uuid-1",
    "priority": "High",
    "platform": "Web",
    "componentName": "DashboardCard",
    "componentDescription": "Reusable dashboard card component",
    "useCase": "Display various metrics and data",
    "affectedProducts": ["Product A", "Product B"],
    "designReferenceLink": "https://figma.com/...",
    "referenceProduct": "Competitor Product",
    "interactionBehaviour": "Click to expand",
    "responsiveBehaviour": "Responsive",
    "accessibilityRequirement": true,
    "stateRequirements": ["Default", "Hover", "Active"],
    "impactLevel": "High Impact",
    "deadline": "2025-02-28",
    "businessGoal": "Improve dashboard UX",
    "additionalNotes": "Needs animation for smooth transition",
    "status": "in_design",
    "workflow": "designer",
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-17T14:22:00.000Z",
    "logs": [
      {
        "id": "log-uuid-1",
        "requestId": "req-uuid-1",
        "actor": "John Dev",
        "actorId": "user-uuid-1",
        "actorRole": "developer",
        "action": "created",
        "note": "Request submitted.",
        "icon": "📝",
        "dotClass": "info",
        "badge": { "class": "b-backlog", "text": "backlog" },
        "figmaLink": null,
        "previewLink": null,
        "screenshotName": null,
        "screenshotDataUrl": null,
        "docLink": null,
        "componentName": null,
        "at": "2025-01-15T10:30:00.000Z"
      }
    ]
  }
]
```

---

#### GET /:id
Get single request with full workflow logs.

**Response (200):** Single request object (same format as GET /)

---

#### POST /
Create new request (developer/designer/admin required).

**Request:**
```json
{
  "title": "New Component Request",
  "requestType": "new_component",
  "componentName": "MyComponent",
  "componentDescription": "Description of component",
  "useCase": "What will it be used for",
  "priority": "High",
  "platform": "Web",
  "affectedProducts": ["Product A"],
  "designReferenceLink": "https://figma.com/...",
  "referenceProduct": "Reference",
  "interactionBehaviour": "Click behavior",
  "responsiveBehaviour": "Responsive",
  "accessibilityRequirement": true,
  "stateRequirements": ["Default", "Hover"],
  "impactLevel": "High Impact",
  "deadline": "2025-02-28",
  "businessGoal": "Improve experience",
  "additionalNotes": "Additional info"
}
```

**Required Fields:**
- `title`
- `requestType`
- `componentName`
- `componentDescription`
- `useCase`

**Response (201):** Created request object with initial log entry

**Initial Status Rules:**
- If requester is `designer` → status = `need_design_validation`
- Otherwise → status = `backlog`

---

#### POST /:id/action
Execute workflow action on request (state machine controlled).

**Request:**
```json
{
  "action": "start_design",
  "notes": "Starting design work",
  "version": "1.0.0",
  "library": "my-lib",
  "docLink": "https://docs.example.com",
  "figmaLink": "https://figma.com/...",
  "previewLink": "https://preview.example.com",
  "screenshotName": "screenshot.png",
  "screenshotDataUrl": "data:image/png;base64,..."
}
```

**Available Actions**: See State Machine Workflows above

**Validation:**
- Action must exist in STATE_MACHINE
- User role must be allowed for action
- Current request status must be in allowed transitions
- Next status is always server-determined

**Response (200):** Updated request with new log entry

**Error Cases:**
- `400`: Action required
- `403`: Action not allowed for user role
- `409`: Action cannot be performed from current status

---

#### POST /audit/trigger
Trigger audit workflow (designer/admin required).

**Request:**
```json
{
  "componentName": "ComponentToAudit",
  "reason": "Audit reason description",
  "priority": "High",
  "notes": "Additional audit notes"
}
```

**Response (201):** Created audit request with initial log

---

#### PUT /:id/override
Override request status (super_admin only).

**Request:**
```json
{
  "status": "done",
  "note": "Reason for override"
}
```

**Response (200):** Updated request with override log entry

---

### 4. Research Requests `/api/research-requests`

**Auth Required**: All endpoints require authentication.

Separate workflow for research/UX work like user testing, design sprints, etc.

#### Status Values
- `submitted`: Initial state
- `in_progress`: Being worked on
- `completed`: Finished
- `on_hold`: Paused

---

#### GET /
Get all research requests.

**Response (200):**
```json
[
  {
    "id": "rr-uuid-1",
    "requesterId": "user-uuid-1",
    "requesterName": "Jane Designer",
    "requesterEmail": "jane@example.com",
    "requesterPhone": "+1-234-567-8900",
    "department": "Product",
    "whatWeHelp": "UI UX Audit",
    "projectName": "Dashboard Redesign",
    "problemDescription": "Current dashboard is confusing users",
    "timelineQuarter": "Q2",
    "attachmentName": "research_document.pdf",
    "attachmentDataUrl": "data:application/pdf;base64,...",
    "status": "in_progress",
    "notes": "Initial research phase started",
    "createdAt": "2025-01-16T10:30:00.000Z",
    "updatedAt": "2025-01-17T14:22:00.000Z"
  }
]
```

---

#### GET /:id
Get single research request.

**Response (200):** Single research request object

---

#### POST /
Create new research request.

**Request:**
```json
{
  "whatWeHelp": "Usability Testing",
  "projectName": "Mobile App Study",
  "problemDescription": "Need user feedback on app",
  "timelineQuarter": "Q1",
  "department": "Research",
  "attachmentName": "test_plan.pdf",
  "attachmentDataUrl": "data:application/pdf;base64,..."
}
```

**Required Fields:**
- `whatWeHelp`
- `projectName`
- `problemDescription`
- `timelineQuarter`

**Valid Quarters:** Q1, Q2, Q3, Q4

**Response (201):** Created research request

---

#### PUT /:id/status
Update research request status (designer/admin required).

**Request:**
```json
{
  "status": "completed",
  "notes": "Research completed successfully"
}
```

**Response (200):** Updated research request

---

#### DELETE /:id
Delete research request (requester or admin required).

**Response (200):**
```json
{
  "success": true
}
```

---

### 5. Components `/api/components`

**Auth Notes:**
- GET endpoints: No authentication required
- POST/PUT/DELETE: Require `engineer` or `admin` role

Complete catalogue of design system components.

---

#### GET /
Get all active components.

**Response (200):**
```json
[
  {
    "id": "comp-uuid-1",
    "name": "Button",
    "slug": "button",
    "atomicLevel": "atom",
    "category": "forms",
    "description": "Interactive button component",
    "tags": ["interactive", "primary", "form"],
    "isActive": true,
    "figmaUrl": "https://figma.com/...",
    "storybookUrl": "https://storybook.example.com/button",
    "codeOwner": "John Engineer",
    "docLink": "https://docs.example.com/components/button",
    "status": "done",
    "version": "2.1.0",
    "library": "@design-system/ui",
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-17T14:22:00.000Z"
  }
]
```

---

#### GET /:id
Get single component.

**Response (200):** Single component object

**Error Cases:**
- `404`: Component not found

---

#### POST /
Create new component (engineer/admin required).

**Request:**
```json
{
  "name": "Card Component",
  "slug": "card",
  "atomicLevel": "organism",
  "category": "containers",
  "description": "Container for grouped content",
  "tags": ["container", "layout"],
  "figmaUrl": "https://figma.com/...",
  "storybookUrl": "https://storybook.example.com/card",
  "codeOwner": "Dev Team",
  "library": "@design-system/ui",
  "version": "1.0.0",
  "docLink": "https://docs.example.com/components/card"
}
```

**Required Fields:**
- `name`
- `slug`

**Validation:**
- `slug` must be unique across active components

**Response (201):** Created component

**Error Cases:**
- `409`: Slug already exists

---

#### PUT /:id
Update component (engineer/admin required).

**Request:** Same as POST body

**Response (200):** Updated component

---

#### DELETE /:id
Soft delete component (engineer/admin required). Sets `is_active = false`.

**Response (200):**
```json
{
  "ok": true
}
```

---

### 6. Activity Log `/api/activity`

**Auth Required**: Yes

---

#### GET /
Get recent activity log entries (latest 100).

**Response (200):**
```json
[
  {
    "id": "act-uuid-1",
    "action": "Jane Designer — start_design on \"New Button Component\"",
    "actor": "Jane Designer",
    "icon": "🎨",
    "at": "2025-01-17T14:22:00.000Z"
  }
]
```

---

### 7. Menu Settings `/api/menu-settings`

**Auth Notes:**
- GET: No authentication required
- PUT: Requires `admin` role

---

#### GET /
Get menu configuration (public).

**Response (200):**
```json
{
  "navigation": [
    { "label": "Dashboard", "path": "/" },
    { "label": "Requests", "path": "/requests" },
    { "label": "Components", "path": "/components" }
  ]
}
```

If no settings exist, returns empty object `{}`.

---

#### PUT /
Update menu settings (admin required).

**Request:** Menu configuration object

**Response (200):** Updated settings

---

### 8. Data Master `/api/data-master`

**Auth Required**: GET and PUT require authentication. PUT requires `admin` role.

Master data configuration used throughout the application.

---

#### GET /
Get all master data settings.

**Response (200):**
```json
{
  "requestTypes": [
    {
      "value": "new_component",
      "label": "New Component",
      "category": "engineer"
    },
    {
      "value": "research_strategic_design",
      "label": "Strategic Design Thinking",
      "category": "designer"
    }
  ],
  "priorities": ["Critical", "High", "Medium", "Low"],
  "impactLevels": ["Critical Impact", "High Impact", "Moderate Impact", "Low Impact"],
  "stateRequirements": ["Default", "Hover", "Focus", "Active", "Disabled", "Loading", "Error", "Empty"],
  "responsiveBehaviours": ["Responsive", "Desktop Only", "Mobile Only", "Fixed Width"],
  "severityLevels": ["Minor", "Medium", "Major"]
}
```

Note: Returns default settings if none configured.

---

#### PUT /
Update data master settings (admin required).

**Request:**
```json
{
  "requestTypes": [...],
  "priorities": [...],
  "impactLevels": [...],
  "stateRequirements": [...],
  "responsiveBehaviours": [...],
  "severityLevels": [...]
}
```

**Validation:**
- `requestTypes` and `priorities` must be arrays
- All arrays should not be empty

**Response (200):** Updated settings

---

## Module Structure

### Services: Parsers (`src/services/parsers.js`)

Shared data transformation utilities:

- `parseRequest(r)` - Convert DB request row to API format
- `parseRequestLog(l)` - Convert DB log row to API format
- `parseComponent(c)` - Convert DB component row to API format
- `parseResearchRequest(r)` - Convert DB research request to API format
- `parseUser(u)` - Convert DB user to API format (removes password)

### Services: Validators (`src/services/validators.js`)

Shared validation utilities:

- `isValidEmail(email)` - Validate email format
- `isValidPassword(password)` - Validate password strength (min 8 chars)
- `isValidRole(role)` - Validate user role
- `isValidUserStatus(status)` - Validate user status
- `isValidRequestStatus(status)` - Validate request workflow status
- `isValidResearchStatus(status)` - Validate research request status
- `isValidQuarter(quarter)` - Validate timeline quarter

### Database Queries

All database operations use SQLite with prepared statements to prevent SQL injection.

**Connection:** `getDb()` returns database connection from `src/data/db.js`

---

## Common Usage Patterns

### Example: Create Request and Perform Action

```bash
# 1. Create new request
curl -X POST http://localhost:3001/api/requests \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Component",
    "requestType": "new_component",
    "componentName": "Alert",
    "componentDescription": "Alert notification component",
    "useCase": "Show important messages"
  }'
# Returns: Request with id "req-123" and logs

# 2. Start design work (designer)
curl -X POST http://localhost:3001/api/requests/req-123/action \
  -H "Authorization: Bearer <designer-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "approve_validation",
    "notes": "Validated request"
  }'

# 3. Start design
curl -X POST http://localhost:3001/api/requests/req-123/action \
  -H "Authorization: Bearer <designer-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "start_design",
    "notes": "Starting design"
  }'

# 4. Finish design
curl -X POST http://localhost:3001/api/requests/req-123/action \
  -H "Authorization: Bearer <designer-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "finish_design",
    "notes": "Design ready for review"
  }'

# 5. Start development (engineer)
curl -X POST http://localhost:3001/api/requests/req-123/action \
  -H "Authorization: Bearer <engineer-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "start_dev",
    "notes": "Starting development"
  }'

# 6. Publish component (engineer)
curl -X POST http://localhost:3001/api/requests/req-123/action \
  -H "Authorization: Bearer <engineer-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "publish",
    "version": "1.0.0",
    "library": "@design-system/ui",
    "docLink": "https://docs.example.com/alert",
    "notes": "Published to production"
  }'
```

This demonstrates the full request lifecycle from creation through publication.

---

## Maintenance Notes

### Adding a New Module

To add a new API module:

1. Create controller in `src/controllers/newModuleController.js`
2. Create route in `src/routes/newModule.js`
3. Mount route in `src/index.js`:
   ```javascript
   app.use('/api/new-module', require('./routes/newModule'));
   ```
4. Add shared utilities to `src/services/` if needed
5. Update this documentation

### Error Handling Best Practices

Controllers follow these error handling patterns:

```javascript
try {
  // Perform operation
  res.json(result);
} catch (error) {
  console.error('Operation error:', error);
  res.status(500).json({ error: 'Failed to perform operation' });
}
```

### Performance Considerations

- Database queries use SELECT * sparingly; specify columns when possible
- Logs are fetched for requests separately to avoid large data transfers
- Activity log limited to 100 recent entries
- Components filtered by `is_active = 1` to exclude soft-deleted items

---

## Version

- **Version**: 1.0.0
- **Last Updated**: January 2025
- **API Base URL**: `http://localhost:3001/api`

