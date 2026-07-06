# Technical Design Document: Categories API

## Overview

The Categories API implements a RESTful CRUD interface for managing exam categories in the PYQ Papers Platform. This feature serves as the foundational learning module, demonstrating the layered architecture pattern (routes → controllers → models → database) that will be replicated for Exams and Papers resources.

The API exposes five endpoints for category management: list all categories, retrieve by slug, create, update, and delete. Each operation follows Express.js conventions for HTTP methods and status codes, with automatic slug generation from category names to support SEO-friendly URLs.

## Architecture

### Layered Separation of Concerns

The implementation follows a strict three-layer architecture:

```
HTTP Request → Routes → Controller → Model → PostgreSQL
                  ↓         ↓          ↓
            Routing     Business    Data Access
            Layer        Logic       Layer
```

**Routes Layer** (`src/routes/category.routes.ts`)
- Defines HTTP endpoint mappings (GET, POST, PUT, DELETE)
- Attaches validation middleware to appropriate endpoints
- Delegates all request handling to controller functions
- Contains zero business logic or SQL

**Controller Layer** (`src/controllers/category.controller.ts`)
- Handles request/response transformation
- Implements slug generation logic
- Calls model functions for database operations
- Constructs HTTP responses with appropriate status codes
- Performs error handling and status code mapping
- Contains zero raw SQL queries

**Model Layer** (`src/models/category.model.ts`)
- Encapsulates all SQL queries for the categories table
- Uses parameterized queries for SQL injection prevention
- Returns plain JavaScript objects (not HTTP responses)
- Imports and uses the shared connection pool from `src/config/db.ts`

### Data Flow Examples

**Create Category Flow:**
```
POST /api/categories { name: "SSC Exams" }
    ↓
Route validates input (middleware)
    ↓
Controller receives validated request
    ↓
Controller generates slug: "ssc-exams"
    ↓
Controller calls Model.create({ name, slug })
    ↓
Model executes INSERT with parameterized query
    ↓
Model returns plain object { id: 1, name: "SSC Exams", slug: "ssc-exams" }
    ↓
Controller sends 201 response with created category
```

**Retrieve by Slug Flow:**
```
GET /api/categories/ssc-exams
    ↓
Route extracts :slug parameter
    ↓
Controller calls Model.findBySlug("ssc-exams")
    ↓
Model executes SELECT with parameterized query
    ↓
Model returns category object or null
    ↓
Controller sends 200 with data OR 404 if not found
```

## Component Design

### TypeScript Interfaces

**File:** `src/types/category.ts`

```typescript
export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface CreateCategoryInput {
  name: string;
}

export interface UpdateCategoryInput {
  name: string;
}
```

**Design Rationale:**
- `Category` represents the complete database record with auto-generated `id` and `slug`
- Input interfaces separate concerns: API consumers provide only the `name`
- The controller generates `slug` from `name` before calling the model
- Strongly typed interfaces enable compile-time validation and IDE support

### Model Layer

**File:** `src/models/category.model.ts`

**Responsibilities:**
- Execute all SQL operations against the `categories` table
- Use parameterized queries exclusively (`pool.query(text, values)`)
- Return plain data objects, never HTTP responses
- Handle database-level errors (let controller decide HTTP status codes)

**Functions:**

```typescript
async function getAll(): Promise<Category[]>
```
- Executes: `SELECT id, name, slug FROM categories ORDER BY name ASC`
- Returns array of all categories (empty array if none exist)
- No pagination in initial implementation

```typescript
async function findBySlug(slug: string): Promise<Category | null>
```
- Executes: `SELECT id, name, slug FROM categories WHERE slug = $1`
- Returns single category or `null` if not found
- Uses parameterized query to prevent SQL injection

```typescript
async function create(name: string, slug: string): Promise<Category>
```
- Executes: `INSERT INTO categories (name, slug) VALUES ($1, $2) RETURNING id, name, slug`
- Returns newly created category with auto-generated `id`
- Database enforces unique constraint on `slug` column
- Throws error if slug already exists (controller maps to 409)

```typescript
async function update(currentSlug: string, name: string, newSlug: string): Promise<Category | null>
```
- Executes: `UPDATE categories SET name = $1, slug = $2 WHERE slug = $3 RETURNING id, name, slug`
- Returns updated category or `null` if slug not found
- Uses `currentSlug` to identify record, updates to `newSlug` if name changed
- Throws error if `newSlug` conflicts with another category

```typescript
async function deleteBySlug(slug: string): Promise<boolean>
```
- Executes: `DELETE FROM categories WHERE slug = $1`
- Returns `true` if row was deleted, `false` if slug didn't exist
- Can check `result.rowCount` to determine if deletion occurred

**Error Handling Strategy:**
- Let PostgreSQL errors bubble up to controller (e.g., unique constraint violations)
- Controller interprets error types and maps to appropriate HTTP status codes
- Model layer does not catch or transform errors

### Controller Layer

**File:** `src/controllers/category.controller.ts`

**Responsibilities:**
- Transform HTTP requests into model function calls
- Generate slugs from category names
- Map model results and errors to HTTP status codes
- Construct JSON responses

**Functions:**

```typescript
async function getAllCategories(req: Request, res: Response): Promise<void>
```
- Calls `Model.getAll()`
- Always returns 200 with array (empty if no categories)
- Error handling: database errors return 500

```typescript
async function getCategoryBySlug(req: Request, res: Response): Promise<void>
```
- Extracts `slug` from `req.params.slug`
- Calls `Model.findBySlug(slug)`
- Returns 200 with category if found
- Returns 404 if `null` received from model
- Error handling: database errors return 500

```typescript
async function createCategory(req: Request, res: Response): Promise<void>
```
- Extracts `name` from validated `req.body`
- Generates `slug` using `generateSlug(name)`
- Calls `Model.create(name, slug)`
- Returns 201 with created category
- Returns 409 if unique constraint violated (duplicate slug)
- Error handling: database errors return 500

```typescript
async function updateCategory(req: Request, res: Response): Promise<void>
```
- Extracts current `slug` from `req.params.slug`
- Extracts new `name` from validated `req.body`
- Generates new `slug` using `generateSlug(name)`
- Calls `Model.update(currentSlug, name, newSlug)`
- Returns 200 with updated category if found
- Returns 404 if category doesn't exist
- Returns 409 if new slug conflicts with another category
- Error handling: database errors return 500

```typescript
async function deleteCategory(req: Request, res: Response): Promise<void>
```
- Extracts `slug` from `req.params.slug`
- Calls `Model.deleteBySlug(slug)`
- Returns 204 (no content) if deleted
- Returns 404 if category doesn't exist
- Error handling: database errors return 500

**Slug Generation Logic:**

```typescript
function generateSlug(name: string): string
```

Transformation rules (applied in sequence):
1. Convert to lowercase
2. Replace spaces with hyphens
3. Remove all characters except alphanumeric, hyphens, and underscores
4. Collapse multiple consecutive hyphens into single hyphen
5. Trim leading and trailing hyphens

Examples:
- `"SSC Exams"` → `"ssc-exams"`
- `"Banking & Finance"` → `"banking-finance"`
- `"  UPSC   (Civil Services)  "` → `"upsc-civil-services"`
- `"Police---Constable"` → `"police-constable"`

**Error Code Mapping:**

| Condition | HTTP Status | Response Body |
|-----------|-------------|---------------|
| Category found | 200 | `{ id, name, slug }` |
| Category created | 201 | `{ id, name, slug }` |
| Category deleted | 204 | (empty) |
| Validation failure | 400 | `{ error: "message" }` |
| Category not found | 404 | `{ error: "Category not found" }` |
| Slug conflict | 409 | `{ error: "Category with this name already exists" }` |
| Database error | 500 | `{ error: "Internal server error" }` |

### Routes Layer

**File:** `src/routes/category.routes.ts`

**Responsibilities:**
- Define HTTP method and path mappings
- Attach validation middleware to POST and PUT routes
- Export configured Express Router

**Route Definitions:**

```typescript
import { Router } from 'express';
import * as controller from '../controllers/category.controller';
import { validateCategoryInput } from '../middleware/validation';

const router = Router();

// GET /api/categories - List all categories
router.get('/', controller.getAllCategories);

// GET /api/categories/:slug - Get category by slug
router.get('/:slug', controller.getCategoryBySlug);

// POST /api/categories - Create new category
router.post('/', validateCategoryInput, controller.createCategory);

// PUT /api/categories/:slug - Update category
router.put('/:slug', validateCategoryInput, controller.updateCategory);

// DELETE /api/categories/:slug - Delete category
router.delete('/:slug', controller.deleteCategory);

export default router;
```

**Integration with Server:**

In `src/server.ts`, register the category routes:

```typescript
import categoryRoutes from './routes/category.routes';

app.use('/api/categories', categoryRoutes);
```

This mounts all category routes under the `/api/categories` base path.

### Validation Middleware

**File:** `src/middleware/validation.ts`

**Purpose:** Validate request bodies before they reach controller logic

**Implementation Approach:**

Manual validation (no external libraries in Phase 2):

```typescript
export function validateCategoryInput(req: Request, res: Response, next: NextFunction): void {
  const { name } = req.body;
  
  // Check presence
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  
  // Check type
  if (typeof name !== 'string') {
    return res.status(400).json({ error: 'Name must be a string' });
  }
  
  // Check empty/whitespace
  if (name.trim().length === 0) {
    return res.status(400).json({ error: 'Name cannot be empty' });
  }
  
  // Check length
  if (name.length > 255) {
    return res.status(400).json({ error: 'Name cannot exceed 255 characters' });
  }
  
  next();
}
```

**Why Manual Validation First:**
- Phase 2 focuses on understanding the layered architecture
- Introducing Zod or similar libraries adds cognitive load
- Manual validation makes the validation logic explicit and educational
- Phase 4 will refactor to use a validation library (likely Zod)

**Validation Rules:**
- `name` field is required
- `name` must be a non-empty string
- `name` cannot be only whitespace
- `name` maximum length is 255 characters (matches database column)

## Database Schema

**Existing Table:** `categories`

```sql
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE
);
```

**Schema Analysis:**
- `id`: Auto-incrementing primary key
- `name`: Display name for the category (not unique, allows duplicates after deletion)
- `slug`: URL-safe identifier, must be unique (enforced by database constraint)

**Index Considerations:**
- Primary key on `id` provides automatic index
- Unique constraint on `slug` creates implicit index for fast lookups
- No additional indexes needed for Phase 2 (small dataset)
- Consider adding index on `name` if future requirements include name-based search

## Error Handling

### Error Categories

**Client Errors (4xx):**
- 400 Bad Request: Validation failures (missing field, empty name, too long)
- 404 Not Found: Slug doesn't exist for GET, PUT, DELETE
- 409 Conflict: Slug already exists for CREATE, or new slug conflicts on UPDATE

**Server Errors (5xx):**
- 500 Internal Server Error: Database connection failures, unexpected errors

### Error Response Format

All errors return JSON with consistent shape:

```json
{
  "error": "Human-readable error message"
}
```

Examples:
```json
{ "error": "Name is required" }
{ "error": "Category not found" }
{ "error": "Category with this name already exists" }
{ "error": "Internal server error" }
```

**Design Decision:** Keep error responses simple for Phase 2. Phase 4 will introduce structured error objects with error codes, fields, and validation details.

### Error Handling in Controllers

All controller functions wrap operations in try-catch blocks:

```typescript
try {
  // Business logic
} catch (error) {
  // Check for specific PostgreSQL error codes
  if (error.code === '23505') { // Unique constraint violation
    return res.status(409).json({ error: 'Category with this name already exists' });
  }
  
  // Generic error
  console.error('Database error:', error);
  return res.status(500).json({ error: 'Internal server error' });
}
```

**PostgreSQL Error Codes:**
- `23505`: Unique constraint violation (duplicate slug)
- Other codes logged and returned as 500

## Testing Strategy

### Unit Tests

Unit tests focus on specific examples, edge cases, and error conditions:

**Model Layer Tests:**
- Create category with valid data
- Retrieve existing category by slug
- Return null when slug not found
- Delete existing category
- Handle duplicate slug on creation (expect error)

**Controller Layer Tests:**
- Slug generation with various inputs (spaces, special chars, case)
- Error mapping (404 for not found, 409 for conflicts)
- Response format verification

**Validation Middleware Tests:**
- Missing name field
- Empty string name
- Whitespace-only name
- Name exceeding 255 characters
- Valid name passes validation

### Property-Based Tests

Property tests verify universal correctness properties across many randomized inputs. Each test runs a minimum of 100 iterations.

**Test Configuration:**
- Minimum 100 iterations per property
- Generate random category names with varying characteristics:
  - Different lengths (1-255 characters)
  - Mixed case, spaces, special characters
  - Unicode characters
  - Leading/trailing whitespace
- Generate random slugs for retrieval tests

**Property Test Suite Structure:**
- Test file: `tests/properties/category.properties.test.ts`
- Uses property-based testing library (fast-check for TypeScript/JavaScript)
- Each property references its design document property number
- Tag format: `Feature: categories-api, Property {N}: {description}`

## File Structure

New files to be created:

```
src/
├── types/
│   └── category.ts                    (Category interface definitions)
├── models/
│   └── category.model.ts              (Database queries)
├── controllers/
│   └── category.controller.ts         (Business logic)
├── routes/
│   └── category.routes.ts             (Route definitions)
├── middleware/
│   └── validation.ts                  (Input validation)
└── server.ts                          (Updated: import and register routes)

tests/
├── unit/
│   ├── models/
│   │   └── category.model.test.ts
│   ├── controllers/
│   │   └── category.controller.test.ts
│   └── middleware/
│       └── validation.test.ts
└── properties/
    └── category.properties.test.ts
```

**Implementation Order:**
1. Create type definitions (`src/types/category.ts`)
2. Implement model layer (`src/models/category.model.ts`)
3. Implement controller layer with slug generation (`src/controllers/category.controller.ts`)
4. Implement validation middleware (`src/middleware/validation.ts`)
5. Define routes (`src/routes/category.routes.ts`)
6. Register routes in server (`src/server.ts`)
7. Write unit tests
8. Write property-based tests

## Integration Points

### Database Connection

All model functions import the shared connection pool:

```typescript
import pool from '../config/db';

export async function getAll(): Promise<Category[]> {
  const result = await pool.query('SELECT id, name, slug FROM categories ORDER BY name ASC');
  return result.rows;
}
```

**Why use the shared pool:**
- Connection pooling improves performance (reuses connections)
- Configuration centralized in one place (`src/config/db.ts`)
- Prevents connection leaks from creating multiple pools
- Automatic connection management (acquire/release handled by `pg` library)

### Server Registration

Routes must be registered in `src/server.ts` after middleware setup:

```typescript
// Existing middleware
app.use(cors());
app.use(express.json());

// Health check route
app.get('/health', async (req, res) => { /* ... */ });

// Register category routes
import categoryRoutes from './routes/category.routes';
app.use('/api/categories', categoryRoutes);

// Start server
app.listen(PORT, () => { /* ... */ });
```

**Registration Order Matters:**
1. CORS and body parser middleware first
2. Health check route
3. Feature routes (categories, exams, papers)
4. Error handler middleware (Phase 4)

## Future Considerations

### Phase 3 Extensions

When implementing Exams and Papers resources:
- Follow the same layered pattern
- Exams will have similar CRUD with `category_id` foreign key
- Papers will reference `exam_id` and include S3 integration
- Nested routes: `GET /api/categories/:categorySlug/exams`

### Phase 4 Refactoring

Error handling improvements:
- Central error handler middleware
- Custom `AppError` class with status codes
- Async wrapper to eliminate try-catch repetition
- Replace manual validation with Zod schemas

### Phase 7 Polish

Production enhancements:
- Pagination for `GET /api/categories` (limit/offset or cursor-based)
- Soft deletes instead of hard deletes
- Audit fields (created_at, updated_at)
- Full-text search on category names

## Learning Objectives

This implementation teaches:

1. **Separation of Concerns:** Routes, controllers, and models have distinct responsibilities
2. **Request Flow:** Understanding how data moves through Express middleware and layers
3. **Database Access:** Parameterized queries, connection pooling, and SQL basics
4. **Error Handling:** Mapping database errors to HTTP status codes
5. **Type Safety:** Using TypeScript interfaces for compile-time validation
6. **REST Conventions:** Proper use of HTTP methods and status codes
7. **Input Validation:** Protecting the database from invalid data
8. **Slug Generation:** Creating SEO-friendly URLs from user input

**Next Steps After Implementation:**
- Test each endpoint using curl, Postman, or REST Client
- Verify database state after each operation
- Understand error scenarios by intentionally causing failures
- Repeat this pattern for Exams and Papers resources

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Category Response Completeness

*For any* category returned by the API (from any endpoint), the response SHALL include all three required fields: `id` (number), `name` (string), and `slug` (string).

**Validates: Requirements 1.5, 2.4**

### Property 2: Category Retrieval Round-Trip

*For any* category successfully created in the database, retrieving that category by its slug SHALL return an equivalent category with the same `name` and `slug` values.

**Validates: Requirements 2.2, 3.2**

### Property 3: Non-Existent Resource Returns 404

*For any* slug that does not exist in the database, attempting to retrieve (GET), update (PUT), or delete (DELETE) that category SHALL return HTTP status 404.

**Validates: Requirements 2.3, 4.5, 5.4, 13.3**

### Property 4: Successful Creation Returns 201 With Complete Data

*For any* valid category creation request, the API SHALL return HTTP status 201 with a response body containing the created category including its auto-generated `id` and generated `slug`.

**Validates: Requirements 3.3, 3.6**

### Property 5: Slug Generation Correctness

*For any* category name input, the generated slug SHALL be lowercase, replace spaces with hyphens, remove special characters (except hyphens), collapse consecutive hyphens, and trim leading/trailing hyphens.

**Validates: Requirements 3.4, 8.1, 8.2, 8.3, 8.4, 8.5**

### Property 6: Duplicate Slug Prevention

*For any* existing category, attempting to create a new category with a name that generates the same slug, or attempting to update a different category to generate that slug, SHALL return HTTP status 409.

**Validates: Requirements 3.5, 4.4, 13.4**

### Property 7: Update Persists Changes

*For any* existing category and any valid new name, updating the category SHALL result in the new name and regenerated slug being stored and retrievable from the database.

**Validates: Requirements 4.2, 4.3**

### Property 8: Successful Update Returns 200 With Updated Data

*For any* valid category update request on an existing category, the API SHALL return HTTP status 200 with the updated category data.

**Validates: Requirements 4.6**

### Property 9: Deletion Removes Category

*For any* existing category, deleting the category by slug SHALL result in that category no longer being retrievable from the database and SHALL return HTTP status 204 with an empty response body.

**Validates: Requirements 5.2, 5.3**

### Property 10: Invalid Input Rejected

*For any* POST or PUT request with a missing `name` field, empty `name`, whitespace-only `name`, or `name` exceeding 255 characters, the API SHALL return HTTP status 400 with an error message.

**Validates: Requirements 6.1, 6.2, 6.3, 7.1, 7.2, 7.3**

### Property 11: Error Responses Are JSON

*For any* error response from the API, the response body SHALL be valid JSON containing an `error` field with a descriptive message.

**Validates: Requirements 13.5**

---

## Appendix: Example API Interactions

### Create Category

**Request:**
```http
POST /api/categories
Content-Type: application/json

{
  "name": "SSC Exams"
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "name": "SSC Exams",
  "slug": "ssc-exams"
}
```

### Get All Categories

**Request:**
```http
GET /api/categories
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "SSC Exams",
    "slug": "ssc-exams"
  },
  {
    "id": 2,
    "name": "Banking Exams",
    "slug": "banking-exams"
  }
]
```

### Get Category by Slug

**Request:**
```http
GET /api/categories/ssc-exams
```

**Response (200 OK):**
```json
{
  "id": 1,
  "name": "SSC Exams",
  "slug": "ssc-exams"
}
```

**Response if not found (404 Not Found):**
```json
{
  "error": "Category not found"
}
```

### Update Category

**Request:**
```http
PUT /api/categories/ssc-exams
Content-Type: application/json

{
  "name": "SSC Competitive Exams"
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "name": "SSC Competitive Exams",
  "slug": "ssc-competitive-exams"
}
```

### Delete Category

**Request:**
```http
DELETE /api/categories/ssc-exams
```

**Response (204 No Content):**
```
(empty body)
```

### Validation Error

**Request:**
```http
POST /api/categories
Content-Type: application/json

{
  "name": ""
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Name cannot be empty"
}
```

### Conflict Error

**Request (when "SSC Exams" already exists):**
```http
POST /api/categories
Content-Type: application/json

{
  "name": "SSC Exams"
}
```

**Response (409 Conflict):**
```json
{
  "error": "Category with this name already exists"
}
```
