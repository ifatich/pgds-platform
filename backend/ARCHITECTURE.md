# PGDS Backend Architecture Guide

## Overview

This backend follows a **modular, layered architecture** that separates concerns for better maintainability and scalability.

```
┌─────────────────────────────────────────────────────────────┐
│                    Express.js Server                        │
├─────────────────────────────────────────────────────────────┤
│ Routes (Thin Layer - Only Routing)                          │
│ ├── auth.js       ├── users.js      ├── requests.js         │
│ ├── components.js ├── activity.js   ├── menu.js             │
│ └── data-master.js└── research-requests.js                  │
├─────────────────────────────────────────────────────────────┤
│ Controllers (Business Logic)                                │
│ ├── authController.js       ├── usersController.js          │
│ ├── requestsController.js   ├── componentsController.js     │
│ ├── activityController.js   ├── menuController.js           │
│ └── researchRequestsController.js                           │
├─────────────────────────────────────────────────────────────┤
│ Services (Shared Utilities)                                 │
│ ├── parsers.js (Data transformation)                        │
│ └── validators.js (Input validation)                        │
├─────────────────────────────────────────────────────────────┤
│ Middleware (Cross-cutting Concerns)                         │
│ └── auth.js (JWT validation)                                │
├─────────────────────────────────────────────────────────────┤
│ Data Layer (Database)                                       │
│ └── db.js (SQLite connection & migrations)                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Layer Responsibilities

### Routes (`src/routes/`)

**Purpose**: Define API endpoints and mount middleware

**Responsibilities**:
- Define HTTP method and path for each endpoint
- Apply authentication/authorization middleware
- Call appropriate controller function
- Keep route definitions concise and readable

**Example** (`src/routes/users.js`):
```javascript
const router = require('express').Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const usersController = require('../controllers/usersController');

router.use(authenticate);

// Clear, documented route definition
router.get('/', requireAdmin, usersController.getAllUsers);
router.post('/', requireAdmin, usersController.createUser);
router.put('/:id', requireAdmin, usersController.updateUser);

module.exports = router;
```

**Best Practices**:
- Keep routes thin - don't put business logic here
- Use inline middleware only for simple checks
- Add JSDoc comments describing each endpoint
- Mount controller methods directly

---

### Controllers (`src/controllers/`)

**Purpose**: Handle business logic, validation, and database operations

**Responsibilities**:
- Input validation
- Authorization checks
- Database queries
- Error handling
- Response formatting
- Calling services for complex operations

**Example** (`src/controllers/usersController.js`):
```javascript
const bcrypt = require('bcryptjs');
const { parseUser } = require('../services/parsers');
const { isValidEmail, isValidPassword } = require('../services/validators');

async function createUser(req, res) {
  // 1. Extract and validate input
  const { name, email, password, role } = req.body;
  
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  
  // 2. Database operation
  try {
    const id = uuid();
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    getDb().prepare(`INSERT INTO users ...`).run(
      id, name, email, hashedPassword, role, ...
    );
    
    // 3. Format response
    const created = getDb().prepare('SELECT * FROM users WHERE id=?').get(id);
    res.status(201).json(parseUser(created));
  } catch (error) {
    // 4. Handle errors
    if (error.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Failed to create user' });
  }
}

module.exports = { createUser };
```

**Best Practices**:
- Use async/await for async operations
- Validate input at the start
- Use services for shared logic
- Include meaningful error messages
- Use consistent response formats
- Log errors for debugging
- Return appropriate HTTP status codes

---

### Services (`src/services/`)

**Purpose**: Provide reusable utilities and shared functions

#### `parsers.js` - Data Transformation

Converts database row format to API response format:

```javascript
// Database row (snake_case from SQLite)
{
  id: '123',
  created_at: '2025-01-15T10:30:00.000Z',
  user_name: 'John',
  email_address: 'john@example.com'
}

// API response (camelCase)
{
  id: '123',
  createdAt: '2025-01-15T10:30:00.000Z',
  userName: 'John',
  emailAddress: 'john@example.com'
}
```

**Available Parsers**:
- `parseRequest(r)` - Request with nested JSON fields
- `parseRequestLog(l)` - Request log entries
- `parseComponent(c)` - Component with tags JSON
- `parseResearchRequest(r)` - Research request
- `parseUser(u)` - User (removes password hash)

**Usage**:
```javascript
const { parseUser, parseRequest } = require('../services/parsers');

const dbUser = getDb().prepare('SELECT * FROM users WHERE id=?').get(userId);
const apiUser = parseUser(dbUser);

res.json(apiUser);
```

#### `validators.js` - Input Validation

Centralized validation functions:

```javascript
const {
  isValidEmail,
  isValidPassword,
  isValidRole,
  isValidUserStatus,
  isValidRequestStatus,
  isValidResearchStatus,
  isValidQuarter,
} = require('../services/validators');

// Usage
if (!isValidEmail(email)) {
  return res.status(400).json({ error: 'Invalid email format' });
}

if (!isValidRole(role)) {
  return res.status(400).json({ error: 'Invalid role' });
}
```

**Benefits**:
- Consistent validation rules across controllers
- Easy to update validation logic
- Reusable in multiple contexts
- Single source of truth

---

### Middleware (`src/middleware/`)

**Purpose**: Handle cross-cutting concerns (authentication, logging, etc.)

#### `auth.js` - JWT Validation

```javascript
const { sign, authenticate, requireAdmin } = require('../middleware/auth');

// authenticate: Validates JWT and attaches user to req.user
router.get('/protected', authenticate, controller.handler);

// requireAdmin: Validates JWT AND checks role
router.post('/admin-only', requireAdmin, controller.handler);

// sign: Creates JWT token
const token = sign({
  id: userId,
  role: userRole,
  name: userName,
  email: userEmail,
  team: userTeam
});
```

---

### Data Layer (`src/data/`)

**Purpose**: Database connection and query execution

```javascript
const { getDb } = require('../data/db');

// Execute query
const users = getDb()
  .prepare('SELECT * FROM users WHERE status=?')
  .all('active');

// Get single row
const user = getDb()
  .prepare('SELECT * FROM users WHERE id=?')
  .get(userId);

// Insert/Update/Delete
getDb()
  .prepare('INSERT INTO users (id, name, email) VALUES (?, ?, ?)')
  .run(id, name, email);
```

---

## Request Flow Example

Follow a request through the system:

```
1. User sends request
   POST /api/users
   Authorization: Bearer <token>
   { name: "Jane", email: "jane@example.com", ... }

2. Routes layer (src/routes/users.js)
   - Route matched: router.post('/', requireAdmin, usersController.createUser)
   - requireAdmin middleware validates:
     - JWT token exists and is valid
     - User role is admin
   - Calls: usersController.createUser(req, res)

3. Controllers layer (src/controllers/usersController.js)
   async function createUser(req, res) {
     // Extract body
     const { name, email, ... } = req.body;
     
     // Validate input
     if (!isValidEmail(email)) → ERROR 400
     
     // Database operation
     getDb().prepare(...).run(...)
     
     // Format response
     const created = parseUser(dbRow);
     
     // Send response
     res.status(201).json(created);
   }

4. Services layer (called by controller)
   - parseUser(dbRow) transforms database format to API format
   - isValidEmail() validates input
   
5. Response sent to client
   201 Created
   {
     id: "uuid",
     name: "Jane",
     email: "jane@example.com",
     ...
   }
```

---

## Adding a New Module

### Step 1: Create Controller

Create `src/controllers/myModuleController.js`:

```javascript
const { getDb } = require('../data/db');
const { parseMyData } = require('../services/parsers');
const { isValidMyInput } = require('../services/validators');

async function getAllItems(req, res) {
  try {
    const rows = getDb()
      .prepare('SELECT * FROM my_table ORDER BY created_at DESC')
      .all();
    
    res.json(rows.map(parseMyData));
  } catch (error) {
    console.error('Get all items error:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
}

async function createItem(req, res) {
  const { field1, field2 } = req.body;
  
  // Validate
  if (!field1) {
    return res.status(400).json({ error: 'field1 required' });
  }
  
  try {
    const id = uuid();
    const now = new Date().toISOString();
    
    // Create
    getDb().prepare(`INSERT INTO my_table (...) VALUES (...)`).run(...);
    
    // Fetch and return
    const created = getDb()
      .prepare('SELECT * FROM my_table WHERE id=?')
      .get(id);
    
    res.status(201).json(parseMyData(created));
  } catch (error) {
    console.error('Create item error:', error);
    res.status(500).json({ error: 'Failed to create item' });
  }
}

module.exports = {
  getAllItems,
  createItem,
  // ... other functions
};
```

### Step 2: Create Routes

Create `src/routes/myModule.js`:

```javascript
const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const myModuleController = require('../controllers/myModuleController');

/**
 * GET /api/my-module
 * Get all items
 * Auth: Required
 */
router.get('/', authenticate, myModuleController.getAllItems);

/**
 * POST /api/my-module
 * Create item
 * Auth: Required
 */
router.post('/', authenticate, myModuleController.createItem);

// ... more routes

module.exports = router;
```

### Step 3: Mount Route in Server

Edit `src/index.js`:

```javascript
// Add after other route mounts
app.use('/api/my-module', require('./routes/myModule'));
```

### Step 4: Add Parser (if needed)

Edit `src/services/parsers.js`:

```javascript
function parseMyData(row) {
  return {
    id: row.id,
    field1: row.field_1,
    field2: row.field_2,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

module.exports = {
  // ... existing exports
  parseMyData,
};
```

### Step 5: Add Validators (if needed)

Edit `src/services/validators.js`:

```javascript
function isValidMyInput(input) {
  return input && input.length > 0 && input.length <= 255;
}

module.exports = {
  // ... existing exports
  isValidMyInput,
};
```

### Step 6: Update Documentation

Add endpoints to `API_DOCUMENTATION.md` with:
- Endpoint path and method
- Authentication requirements
- Request body example
- Response example
- Error cases

---

## Error Handling Standards

### Response Format

```javascript
// Success
res.status(200).json({ data: result });

// Create success
res.status(201).json(createdObject);

// Bad request
res.status(400).json({ error: 'Missing required field: name' });

// Unauthorized
res.status(401).json({ error: 'Invalid credentials' });

// Forbidden
res.status(403).json({ error: 'Insufficient permissions' });

// Not found
res.status(404).json({ error: 'User not found' });

// Conflict
res.status(409).json({ error: 'Email already exists' });

// Server error
res.status(500).json({ error: 'Failed to create user' });
```

### Error Handling in Controllers

```javascript
try {
  // Perform operation
  res.json(result);
} catch (error) {
  // 1. Log the error for debugging
  console.error('Operation error:', error);
  
  // 2. Check for specific error types
  if (error.message.includes('UNIQUE')) {
    return res.status(409).json({ error: 'Duplicate entry' });
  }
  
  // 3. Return generic server error
  res.status(500).json({ error: 'Failed to perform operation' });
}
```

---

## Performance Tips

1. **Database Queries**:
   - Use SELECT with specific columns when possible
   - Add WHERE clauses to filter early
   - Index frequently queried columns

2. **Response Size**:
   - Don't fetch unnecessary fields
   - Limit array responses (e.g., activity log to 100)
   - Consider pagination for large datasets

3. **Caching**:
   - Cache data master settings in memory
   - Cache frequently accessed catalogs

4. **API Response**:
   - Avoid N+1 queries by joining or batch fetching
   - Flatten nested data when possible

---

## Testing Module

To test a new module locally:

```bash
# 1. Create request to new endpoint
curl -X POST http://localhost:3001/api/my-module \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "field1": "value1", "field2": "value2" }'

# 2. Check response
# 201 Created with formatted response

# 3. Verify database
sqlite3 backend/pgds.db "SELECT * FROM my_table;"

# 4. Test error cases
# Missing required fields, invalid input, permission checks
```

---

## Maintenance Checklist

When modifying modules:

- [ ] Update controller logic clearly with comments
- [ ] Add/update validators if input changes
- [ ] Add/update parsers if output format changes
- [ ] Update API_DOCUMENTATION.md with examples
- [ ] Test all endpoints with authentication
- [ ] Test error cases and edge conditions
- [ ] Verify database queries use prepared statements
- [ ] Check error messages are user-friendly
- [ ] Run through code review process
- [ ] Test with actual frontend integration

---

## Useful Resources

- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [API Security](https://owasp.org/www-project-api-security)
- [REST API Best Practices](https://restfulapi.net/)

---

## Support

For issues or questions about the architecture:
1. Check `API_DOCUMENTATION.md` for endpoint details
2. Review existing controllers for patterns
3. Check git history for context
4. Reach out to the dev team

