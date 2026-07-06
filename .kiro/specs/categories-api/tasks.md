# Implementation Plan: Categories API

## Overview

This implementation builds a full-stack CRUD API for managing exam categories, following the layered architecture pattern (routes → controllers → models → database) with CI/CD practices from the start. The feature demonstrates separation of concerns, TypeScript type safety, input validation, automatic slug generation, proper error handling, automated testing, and continuous integration.

**CI/CD Philosophy:** We set up testing infrastructure and automated checks FIRST, then implement features with tests alongside code. This prevents production breakage by catching errors early through automated builds and tests on every commit.

## Tasks

- [ ] 1. Fix TypeScript build configuration (CRITICAL FIRST STEP)
  - [ ] 1.1 Fix the tsconfig.json module/verbatimModuleSyntax mismatch
    - The project uses `"type": "commonjs"` in package.json but has `verbatimModuleSyntax: true` in tsconfig.json
    - This causes `npm run build` to fail even though `ts-node-dev` works fine
    - Fix by either: (a) changing to `"type": "module"` and using ESM, or (b) adjusting tsconfig to work with CommonJS
    - Verify `npm run build` completes successfully and produces files in `dist/`
    - Verify the compiled code runs: `node dist/server.js` should start the server
    - _Why this matters: CI/CD will run the build on every commit. If build fails, deployment fails._

- [ ] 2. Set up test infrastructure (Jest for TypeScript)
  - [ ] 2.1 Install Jest and TypeScript testing dependencies
    - Install: `jest`, `ts-jest`, `@types/jest`, `supertest`, `@types/supertest`
    - supertest is for HTTP endpoint testing (simulates requests without starting a server)
    - _Why these packages: Jest runs tests, ts-jest compiles TypeScript for Jest, supertest tests Express routes_

  - [ ] 2.2 Create Jest configuration file
    - Create `jest.config.js` in project root
    - Configure preset: `ts-jest`
    - Set testEnvironment: `node`
    - Configure testMatch to find test files in `src/**/*.test.ts` or `tests/**/*.test.ts`
    - Add coverage configuration (collectCoverageFrom, coverageDirectory)
    - _Why: Jest needs to know how to compile TypeScript and where to find test files_

  - [ ] 2.3 Add test scripts to package.json
    - Add `"test": "jest"` for local development
    - Add `"test:watch": "jest --watch"` for development with auto-rerun
    - Add `"test:ci": "jest --ci --coverage --maxWorkers=2"` for CI environments
    - The --ci flag makes Jest better suited for CI (fails on snapshots, no watch mode)
    - _Why separate scripts: Different environments need different Jest behavior_

  - [ ] 2.4 Create a simple smoke test to verify Jest works
    - Create `src/utils/slug.test.ts` with a basic test (e.g., `describe('setup', () => { test('jest works', () => { expect(1).toBe(1); }); })`)
    - Run `npm test` and verify the test passes
    - _Why: Confirms Jest is configured correctly before writing real tests_

  - [ ] 2.5 Set up test database configuration
    - Create `src/config/db.test.ts` or modify existing `db.ts` to support test database
    - Use environment variable `NODE_ENV=test` to switch to test database URL
    - Add `DATABASE_TEST_URL` to `.env.example`
    - Document that tests should use a separate database to avoid corrupting dev data
    - _Why: Never run tests against your development database_

- [ ] 3. Set up GitHub Actions CI pipeline
  - [ ] 3.1 Create `.github/workflows/ci.yml` workflow file
    - Trigger on: push to all branches, pull_request to main
    - Use Node.js version 20 (matches local development)
    - Set up PostgreSQL service container for tests
    - Steps: checkout code, setup Node, install dependencies, run migrations, run build, run tests
    - Fail the entire workflow if any step fails
    - _Why: Automated checks on every commit prevent broken code from reaching production_

  - [ ] 3.2 Configure environment variables for CI
    - Set DATABASE_URL in the workflow to point to the PostgreSQL service container
    - Set NODE_ENV=test
    - Document required secrets in README or workflow comments
    - _Why: CI needs database connection and proper environment to run tests_

  - [ ] 3.3 Add build verification step
    - Ensure `npm run build` runs in CI and fails the build if TypeScript compilation errors occur
    - Verify the dist/ folder is created
    - _Why: Catches TypeScript errors that might not appear in tests_

  - [ ] 3.4 Add database migration check
    - Run `npm run migrate` in CI to ensure migrations can run successfully
    - This catches SQL syntax errors and missing migration files
    - _Why: Broken migrations will fail in production; catch them early_

- [ ] 4. Checkpoint - Verify CI/CD foundation
  - Run `npm run build` locally and confirm it succeeds
  - Run `npm test` locally and confirm Jest works
  - Commit changes and push to GitHub
  - Verify GitHub Actions workflow runs and passes
  - _This checkpoint ensures your safety net is working before writing feature code_

- [ ] 5. Set up TypeScript type definitions
  - [ ] 5.1 Create `src/types/category.ts` with Category, CreateCategoryInput, and UpdateCategoryInput interfaces
    - Define the Category interface with id (number), name (string), and slug (string)
    - Define input interfaces for create and update operations
    - _Requirements: 12.1, 12.2_

- [ ] 6. Implement the Model layer (database queries) with tests
  - [ ] 6.1 Create `src/models/category.model.ts` with all database query functions
    - Import the shared connection pool from `src/config/db.ts`
    - Implement `getAll()` to retrieve all categories ordered by name
    - Implement `findBySlug(slug)` to retrieve a single category
    - Implement `create(name, slug)` to insert a new category with RETURNING clause
    - Implement `update(currentSlug, name, newSlug)` to update a category
    - Implement `deleteBySlug(slug)` to delete a category
    - Use parameterized queries for all SQL operations
    - Return plain data objects (not HTTP responses)
    - _Requirements: 9.1, 9.2, 9.3, 10.6, 12.3, 11.2_

  - [ ] 6.2 Write unit tests for model layer (MANDATORY)
    - Create `src/models/category.model.test.ts`
    - Test successful CRUD operations
    - Test null returns for non-existent slugs
    - Test duplicate slug constraint violation
    - Use beforeEach to clear test database and ensure test isolation
    - Run `npm test` and ensure all model tests pass before moving forward
    - _Requirements: 1.2, 2.2, 3.2, 5.2_
    - _Why mandatory: Model tests catch SQL errors and database issues immediately_

- [ ] 7. Implement the Controller layer (business logic) with tests
  - [ ] 7.1 Create slug generation utility function
    - Create `src/utils/slug.ts` with `generateSlug(name: string): string` function
    - Implement: lowercase, replace spaces with hyphens, remove special chars (except hyphens), collapse consecutive hyphens, trim leading/trailing hyphens
    - Export the function
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
    - _Why separate file: Makes it easy to test in isolation_

  - [ ] 7.2 Write unit tests for slug generation (MANDATORY)
    - Create `src/utils/slug.test.ts`
    - Test examples: "SSC Exams" → "ssc-exams", "Banking & Finance" → "banking-finance"
    - Test edge cases: multiple spaces, leading/trailing spaces, special characters, consecutive hyphens
    - Run tests and ensure they pass
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
    - _Why mandatory: Slug generation is critical for URL correctness and uniqueness_

  - [ ] 7.3 Create `src/controllers/category.controller.ts` with all controller functions
    - Import generateSlug from `src/utils/slug`
    - Implement `getAllCategories(req, res)` to handle GET all categories
    - Implement `getCategoryBySlug(req, res)` to handle GET by slug with 404 handling
    - Implement `createCategory(req, res)` with slug generation and 201/409 responses
    - Implement `updateCategory(req, res)` with slug regeneration and 404/409 handling
    - Implement `deleteCategory(req, res)` with 204/404 responses
    - Wrap all operations in try-catch blocks with error-to-status-code mapping
    - Map PostgreSQL error code 23505 (unique constraint) to 409 Conflict
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.4, 4.1, 4.2, 5.1, 10.3, 10.4, 10.5, 12.4, 13.1, 13.2, 13.3, 13.4, 11.3_

  - [ ] 7.4 Write integration tests for controller layer (MANDATORY)
    - Create `src/controllers/category.controller.test.ts`
    - Use supertest to test HTTP endpoints without starting server
    - Test successful operations (200, 201, 204 responses)
    - Test error cases (400, 404, 409, 500 responses)
    - Test response body shapes and data correctness
    - Ensure tests pass before moving forward
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_
    - _Why mandatory: Controller tests verify the entire request/response flow_

- [ ] 8. Checkpoint - Run tests and build
  - Run `npm test` and ensure all tests pass (model, slug, controller tests)
  - Run `npm run build` and ensure TypeScript compilation succeeds
  - Fix any failing tests or build errors before proceeding
  - Commit and push to trigger CI pipeline
  - Verify CI pipeline passes (all tests and build succeed in GitHub Actions)
  - _This checkpoint confirms your implementation is solid before wiring it into the server_

- [ ] 9. Implement validation middleware with tests
  - [ ] 9.1 Create `src/middleware/validation.ts` with validateCategoryInput function
    - Check that name field is present
    - Check that name is a string
    - Check that name is not empty or whitespace-only
    - Check that name does not exceed 255 characters
    - Return 400 with descriptive error messages for validation failures
    - Call next() if validation passes
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 7.4, 13.2, 13.5_

  - [ ] 9.2 Write unit tests for validation middleware (MANDATORY)
    - Create `src/middleware/validation.test.ts`
    - Test missing name field → 400
    - Test empty string name → 400
    - Test whitespace-only name → 400
    - Test name exceeding 255 characters → 400
    - Test valid name → calls next()
    - Ensure all tests pass
    - _Requirements: 6.1, 6.2, 6.3, 7.1, 7.2, 7.3_
    - _Why mandatory: Validation prevents bad data from reaching your database_

- [ ] 10. Implement the Routes layer and wire into server
  - [ ] 10.1 Create `src/routes/category.routes.ts` with all HTTP endpoint definitions
    - Define GET / for getAllCategories
    - Define GET /:slug for getCategoryBySlug
    - Define POST / with validateCategoryInput middleware for createCategory
    - Define PUT /:slug with validateCategoryInput middleware for updateCategory
    - Define DELETE /:slug for deleteCategory
    - Export configured Express Router
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 10.1, 10.2, 11.4_

  - [ ] 10.2 Register category routes in `src/server.ts`
    - Import category routes after existing middleware
    - Mount routes at `/api/categories` base path
    - _Requirements: 10.1, 11.5_

  - [ ] 10.3 Write end-to-end integration tests for routes (MANDATORY)
    - Create `tests/integration/categories.test.ts`
    - Test complete request/response flows for all five endpoints
    - Test GET /api/categories returns array
    - Test POST /api/categories creates category and returns 201
    - Test GET /api/categories/:slug returns category or 404
    - Test PUT /api/categories/:slug updates and returns 200 or 404
    - Test DELETE /api/categories/:slug returns 204 or 404
    - Test validation errors return 400
    - Test duplicate slug returns 409
    - Run tests and ensure they pass
    - _Why mandatory: End-to-end tests verify the entire system works together_

- [ ] 11. Final checkpoint - Complete CI/CD validation
  - Run `npm test` locally and ensure ALL tests pass (model, controller, validation, routes, integration)
  - Run `npm run build` and ensure compilation succeeds
  - Start the server with `npm run dev` and manually test one endpoint with curl or Postman
  - Commit all changes and push to GitHub
  - Verify GitHub Actions CI pipeline passes completely (build, migrations, all tests)
  - Check code coverage report (aim for >80% coverage on new code)
  - _This checkpoint confirms the feature is production-ready with full CI/CD protection_

- [ ]* 12. Optional: Property-Based Tests (Advanced Testing)
  - [ ]* 12.1 Install fast-check for property-based testing
    - Install `fast-check` as a dev dependency
    - _Why optional: Property-based tests are advanced and can be added after core functionality works_

  - [ ]* 12.2 Write property test for slug generation correctness
    - **Property 5: Slug Generation Correctness**
    - **Validates: Requirements 3.4, 8.1, 8.2, 8.3, 8.4, 8.5**
    - Generate random category names with varying lengths, cases, spaces, and special characters
    - Verify generated slugs are lowercase, use hyphens for spaces, remove special chars, collapse consecutive hyphens, and trim

  - [ ]* 12.3 Write property test for category response completeness
    - **Property 1: Category Response Completeness**
    - **Validates: Requirements 1.5, 2.4**
    - For any category returned by any endpoint, verify response includes id, name, and slug fields with correct types

  - [ ]* 12.4 Write property test for round-trip consistency
    - **Property 2: Category Retrieval Round-Trip**
    - **Validates: Requirements 2.2, 3.2**
    - Create a category, then retrieve it by slug, verify name and slug match

  - [ ]* 12.5 Write property test for non-existent resource handling
    - **Property 3: Non-Existent Resource Returns 404**
    - **Validates: Requirements 2.3, 4.5, 5.4, 13.3**
    - Generate random non-existent slugs and verify GET, PUT, DELETE all return 404

  - [ ]* 12.6 Write property test for successful creation response
    - **Property 4: Successful Creation Returns 201 With Complete Data**
    - **Validates: Requirements 3.3, 3.6**
    - Create categories and verify 201 status with complete data including auto-generated id and slug

  - [ ]* 12.7 Write property test for duplicate slug prevention
    - **Property 6: Duplicate Slug Prevention**
    - **Validates: Requirements 3.5, 4.4, 13.4**
    - Create a category, then attempt to create/update another with the same generated slug, verify 409 response

  - [ ]* 12.8 Write property test for update persistence
    - **Property 7: Update Persists Changes**
    - **Validates: Requirements 4.2, 4.3**
    - Update a category and verify the new name and slug are stored and retrievable

  - [ ]* 12.9 Write property test for successful update response
    - **Property 8: Successful Update Returns 200 With Updated Data**
    - **Validates: Requirements 4.6**
    - Verify valid updates return 200 with updated category data

  - [ ]* 12.10 Write property test for deletion behavior
    - **Property 9: Deletion Removes Category**
    - **Validates: Requirements 5.2, 5.3**
    - Delete a category and verify it returns 204 and is no longer retrievable

  - [ ]* 12.11 Write property test for invalid input rejection
    - **Property 10: Invalid Input Rejected**
    - **Validates: Requirements 6.1, 6.2, 6.3, 7.1, 7.2, 7.3**
    - Generate invalid inputs (missing name, empty, whitespace-only, too long) and verify 400 responses

  - [ ]* 12.12 Write property test for error response format
    - **Property 11: Error Responses Are JSON**
    - **Validates: Requirements 13.5**
    - Trigger various error conditions and verify all return JSON with an error field

- [ ] 13. Documentation and completion
  - [ ] 13.1 Add testing documentation to README
    - Document how to run tests (`npm test`, `npm run test:watch`)
    - Document CI/CD pipeline and what it checks
    - Explain the test strategy (unit tests, integration tests, property tests)
    
  - [ ] 13.2 Add environment variable documentation
    - Update `.env.example` with DATABASE_TEST_URL
    - Document all required environment variables for development and testing

## Notes

**CI/CD First Approach:**
- We fix the TypeScript build issue FIRST (task 1) so CI can compile the code
- We set up Jest and GitHub Actions BEFORE writing feature code (tasks 2-4)
- Tests are MANDATORY (not optional) for core functionality - marked without `*`
- Property-based tests (task 12) are optional advanced testing
- Every checkpoint includes running tests and verifying CI passes

**Test Strategy:**
- **Unit tests**: Test individual functions in isolation (slug generation, validation, model queries)
- **Integration tests**: Test complete request/response flows through controllers
- **End-to-end tests**: Test entire API endpoints through routes
- **Property tests (optional)**: Test universal properties with randomized inputs

**Why This Order Matters:**
1. **Fix build first** - CI needs successful builds
2. **Set up tests early** - Write tests alongside code, not after
3. **Verify CI works** - Catch configuration issues before writing feature code
4. **Implement in layers** - Types → Model+Tests → Controller+Tests → Validation+Tests → Routes+Tests
5. **Checkpoint frequently** - Run tests and CI at each checkpoint

**Benefits for Learning:**
- You'll understand how CI/CD prevents production breakage
- You'll learn test-driven development patterns
- You'll see how tests catch bugs before they reach production
- You'll build muscle memory for writing testable code
- Your resume will show modern CI/CD practices

**Tasks marked with `*` are optional** (advanced property-based tests). All other tests are mandatory.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "2.2"] },
    { "id": 2, "tasks": ["2.3", "2.4", "2.5"] },
    { "id": 3, "tasks": ["3.1", "3.2", "3.3", "3.4"] },
    { "id": 4, "tasks": ["5.1"] },
    { "id": 5, "tasks": ["6.1"] },
    { "id": 6, "tasks": ["6.2"] },
    { "id": 7, "tasks": ["7.1"] },
    { "id": 8, "tasks": ["7.2", "7.3"] },
    { "id": 9, "tasks": ["7.4"] },
    { "id": 10, "tasks": ["9.1"] },
    { "id": 11, "tasks": ["9.2"] },
    { "id": 12, "tasks": ["10.1"] },
    { "id": 13, "tasks": ["10.2"] },
    { "id": 14, "tasks": ["10.3"] },
    { "id": 15, "tasks": ["12.1", "12.2", "12.3", "12.4", "12.5", "12.6", "12.7", "12.8", "12.9", "12.10", "12.11", "12.12", "13.1", "13.2"] }
  ]
}
```
