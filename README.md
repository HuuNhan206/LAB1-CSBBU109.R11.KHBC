# Exercise LAB1 — MySQL CRUD & Query Demo (Node.js)

A Node.js application demonstrating MySQL database operations including CRUD, filtering, sorting, wildcard search, aggregate functions, and GROUP BY with HAVING.

## Features

- **Table creation** with foreign key constraints (`categories` → `items`)
- **CRUD operations** — INSERT, SELECT, UPDATE using parameterized queries
- **Filter & Sort** — `WHERE` with multiple conditions + `ORDER BY`
- **Wildcard search** — `LIKE '%keyword%'` pattern matching
- **Aggregate functions** — `SUM()`, `AVG()`, `COUNT(*)`
- **GROUP BY & HAVING** — Category-level statistics with threshold filtering

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- MySQL Server (v8.0+)

## Setup

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd Exercise_LAB1_Web
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure the database**

   Copy the example environment file and fill in your credentials:
   ```bash
   cp .env.example .env
   ```

   Create the database in MySQL:
   ```sql
   CREATE DATABASE IF NOT EXISTS store_db;
   ```

4. **Run the demo**
   ```bash
   node mysql_demo.js
   ```

## Project Structure

```
Exercise_LAB1_Web/
├── mysql_demo.js      # Main application
├── package.json       # Project metadata & dependencies
├── .env.example       # Environment variable template
├── .gitignore         # Git ignore rules
└── README.md          # This file
```

## Dependencies

| Package | Purpose |
|---------|---------|
| [mysql2](https://www.npmjs.com/package/mysql2) | MySQL client with Promise support |
| [dotenv](https://www.npmjs.com/package/dotenv) | Load environment variables from `.env` |
