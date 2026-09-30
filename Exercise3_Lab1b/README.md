# Exercise 3: NoSQL Data Modeling with Mongoose ODM in Node.js

A lab exercise demonstrating Mongoose schema design, data validation, middleware hooks, and CRUD operations against MongoDB.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [MongoDB](https://www.mongodb.com/) running locally on port `27017`, or a MongoDB Atlas connection string

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create a `.env` file** in the project root:
   ```
   MONGO_URI=mongodb://localhost:27017/shop_mongoose_db
   ```

3. **Run the demo:**
   ```bash
   node mongoose_demo.js
   ```

## What's Covered

### Base CRUD Operations
- **Create** – Insert a new user document
- **Read** – Find a user by email
- **Update** – Update fields with validation
- **Delete** – Delete a user (commented out by default)

### Extended Questions
| # | Topic | Description |
|---|-------|-------------|
| Q1 | Custom Validation (Regex) | Vietnamese phone number validator (10 digits, starts with 03/05/07/08/09) |
| Q2 | Virtual Properties | `displayInfo` virtual combining name, email, and role |
| Q3 | Static Methods | `findActiveByRole(roleName)` — find active users by role, sorted A–Z |
| Q4 | Instance Methods / Soft Delete | `softDelete()` — sets `isDeleted: true` and `isActive: false` |
| Q5 | Middleware Hooks | Pre-save password hashing simulation + pre-find auto-filter of soft-deleted documents |

## Tech Stack

- **Node.js** — Runtime
- **Mongoose** — MongoDB ODM
- **dotenv** — Environment variable management
