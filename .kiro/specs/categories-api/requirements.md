# Requirements Document

## Introduction

The Categories API provides RESTful endpoints for managing exam categories in the PYQ Papers Platform. Categories are the top-level organizational unit (Category → Exam → Paper hierarchy) and must support full CRUD operations with slug-based access for SEO-friendly URLs. This feature serves as the foundational learning module for the layered backend architecture (routes → controllers → models → database), demonstrating separation of concerns, input validation, and auto-generated slug patterns.

## Glossary

- **Category_API**: The REST API endpoints for category resource management
- **Category_Controller**: The business logic layer handling HTTP requests and responses for categories
- **Category_Model**: The data access layer encapsulating SQL queries for the categories table
- **Category_Routes**: The Express route definitions mapping HTTP methods to controller functions
- **Slug_Generator**: The controller-level function that transforms a category name into a URL-safe slug
- **Request_Validator**: The input validation logic ensuring required fields and format constraints
- **Database_Pool**: The shared PostgreSQL connection pool from `src/config/db.ts`
- **Learning_Mode**: The project context where the user writes implementation code and receives guidance and code review

## Requirements

### Requirement 1: Retrieve All Categories

**User Story:** As a frontend developer consuming the API, I want to retrieve all categories, so that I can display a navigation menu or category listing page.

#### Acceptance Criteria

1. THE Category_API SHALL expose a GET endpoint at `/api/categories`
2. WHEN a GET request is received at `/api/categories`, THE Category_API SHALL return all categories from the database
3. WHEN the categories table contains records, THE Category_API SHALL return a JSON array with HTTP status 200
4. WHEN the categories table is empty, THE Category_API SHALL return an empty JSON array with HTTP status 200
5. THE Category_API SHALL include id, name, and slug fields for each category in the response

### Requirement 2: Retrieve Category by Slug

**User Story:** As a frontend developer, I want to retrieve a single category by its slug, so that I can build SEO-friendly URLs and fetch category details for dynamic routes.

#### Acceptance Criteria

1. THE Category_API SHALL expose a GET endpoint at `/api/categories/:slug`
2. WHEN a GET request is received with a valid slug, THE Category_API SHALL return the matching category with HTTP status 200
3. WHEN a GET request is received with a slug that does not exist, THE Category_API SHALL return an error with HTTP status 404
4. THE Category_API SHALL include id, name, and slug fields in the successful response

### Requirement 3: Create New Category

**User Story:** As an admin user, I want to create a new category, so that I can add a new exam classification to the platform.

#### Acceptance Criteria

1. THE Category_API SHALL expose a POST endpoint at `/api/categories`
2. WHEN a POST request is received with valid data, THE Category_API SHALL insert a new record into the categories table
3. THE Category_API SHALL return the created category with HTTP status 201
4. THE Slug_Generator SHALL automatically generate a slug from the name field in the controller
5. WHEN the generated slug already exists in the database, THE Category_API SHALL return an error with HTTP status 409
6. THE Category_API SHALL return the created category including its auto-generated id and slug

### Requirement 4: Update Existing Category

**User Story:** As an admin user, I want to update a category's name, so that I can correct mistakes or improve clarity.

#### Acceptance Criteria

1. THE Category_API SHALL expose a PUT endpoint at `/api/categories/:slug`
2. WHEN a PUT request is received with valid data for an existing slug, THE Category_API SHALL update the category record
3. THE Slug_Generator SHALL regenerate the slug if the name field is modified
4. WHEN the updated slug conflicts with another category, THE Category_API SHALL return an error with HTTP status 409
5. WHEN a PUT request is received for a slug that does not exist, THE Category_API SHALL return an error with HTTP status 404
6. THE Category_API SHALL return the updated category with HTTP status 200

### Requirement 5: Delete Category

**User Story:** As an admin user, I want to delete a category, so that I can remove obsolete or incorrect classifications.

#### Acceptance Criteria

1. THE Category_API SHALL expose a DELETE endpoint at `/api/categories/:slug`
2. WHEN a DELETE request is received for an existing slug, THE Category_API SHALL remove the category from the database
3. THE Category_API SHALL return HTTP status 204 with no response body
4. WHEN a DELETE request is received for a slug that does not exist, THE Category_API SHALL return an error with HTTP status 404

### Requirement 6: Input Validation for Create

**User Story:** As a backend developer, I want to validate input on category creation, so that invalid data does not reach the database.

#### Acceptance Criteria

1. WHEN a POST request is received without a name field, THE Request_Validator SHALL return an error with HTTP status 400
2. WHEN a POST request is received with an empty name field, THE Request_Validator SHALL return an error with HTTP status 400
3. WHEN a POST request is received with a name longer than 255 characters, THE Request_Validator SHALL return an error with HTTP status 400
4. THE Request_Validator SHALL execute before the controller logic processes the request

### Requirement 7: Input Validation for Update

**User Story:** As a backend developer, I want to validate input on category updates, so that invalid data does not corrupt existing records.

#### Acceptance Criteria

1. WHEN a PUT request is received without a name field, THE Request_Validator SHALL return an error with HTTP status 400
2. WHEN a PUT request is received with an empty name field, THE Request_Validator SHALL return an error with HTTP status 400
3. WHEN a PUT request is received with a name longer than 255 characters, THE Request_Validator SHALL return an error with HTTP status 400
4. THE Request_Validator SHALL execute before the controller logic processes the request

### Requirement 8: Slug Generation Rules

**User Story:** As a backend developer, I want consistent slug generation logic, so that category URLs are predictable and SEO-friendly.

#### Acceptance Criteria

1. THE Slug_Generator SHALL convert the name to lowercase
2. THE Slug_Generator SHALL replace spaces with hyphens
3. THE Slug_Generator SHALL remove special characters except hyphens
4. THE Slug_Generator SHALL collapse multiple consecutive hyphens into a single hyphen
5. THE Slug_Generator SHALL trim leading and trailing hyphens

### Requirement 9: Database Integration

**User Story:** As a backend developer, I want the Category_Model to use the shared Database_Pool, so that connection management follows project conventions.

#### Acceptance Criteria

1. THE Category_Model SHALL import the Database_Pool from `src/config/db.ts`
2. THE Category_Model SHALL use parameterized queries for all SQL operations
3. THE Category_Model SHALL return plain data objects and not construct HTTP responses

### Requirement 10: Layered Architecture Compliance

**User Story:** As a learning developer, I want clear separation of concerns across layers, so that I understand backend architecture patterns.

#### Acceptance Criteria

1. THE Category_Routes SHALL define HTTP endpoints and delegate to the Category_Controller
2. THE Category_Routes SHALL contain no business logic or SQL
3. THE Category_Controller SHALL handle request and response logic
4. THE Category_Controller SHALL call the Category_Model for database operations
5. THE Category_Controller SHALL contain no raw SQL queries
6. THE Category_Model SHALL encapsulate all SQL queries for the categories table
7. THE Category_Model SHALL contain no HTTP response construction

### Requirement 11: File Structure

**User Story:** As a learning developer, I want a clear file structure, so that I know where to create each component.

#### Acceptance Criteria

1. THE Category_API SHALL define TypeScript types in `src/types/category.ts`
2. THE Category_API SHALL implement database queries in `src/models/category.model.ts`
3. THE Category_API SHALL implement business logic in `src/controllers/category.controller.ts`
4. THE Category_API SHALL define routes in `src/routes/category.routes.ts`
5. THE Category_Routes SHALL be imported and registered in `src/server.ts`

### Requirement 12: TypeScript Type Safety

**User Story:** As a TypeScript developer, I want strongly typed interfaces, so that I catch errors at compile time.

#### Acceptance Criteria

1. THE Category_API SHALL define a Category interface with id, name, and slug properties
2. THE Category interface SHALL use number for id, string for name, and string for slug
3. THE Category_Model functions SHALL use the Category type for return values
4. THE Category_Controller functions SHALL use typed request parameters

### Requirement 13: Error Handling

**User Story:** As a frontend developer consuming the API, I want consistent error responses, so that I can handle errors predictably.

#### Acceptance Criteria

1. WHEN a database error occurs, THE Category_API SHALL return HTTP status 500 with an error message
2. WHEN validation fails, THE Category_API SHALL return HTTP status 400 with a descriptive message
3. WHEN a resource is not found, THE Category_API SHALL return HTTP status 404 with a descriptive message
4. WHEN a unique constraint is violated, THE Category_API SHALL return HTTP status 409 with a descriptive message
5. THE Category_API SHALL return error responses in JSON format

### Requirement 14: Learning Mode Workflow

**User Story:** As a learning developer, I want guidance to write code myself, so that I understand the implementation deeply.

#### Acceptance Criteria

1. WHERE Learning_Mode is active, THE Category_API implementation SHALL be written by the user
2. THE Category_API guidance SHALL explain concepts before code is written
3. THE Category_API guidance SHALL review user-written code after implementation
4. THE Category_API guidance SHALL not write implementation code unless explicitly requested by the user
