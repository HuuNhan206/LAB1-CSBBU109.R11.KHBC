// Step 1: Import modules
require('dotenv').config();
const mysql = require('mysql2/promise');

// Step 2: Initialize the connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Step 3: Perform basic operations
async function main() {
  try {
    console.log('Connecting to MySQL Database...');

    // PART 1: Basic CRUD 

    // Create the 'categories' table if it doesn't exist
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("-> 'categories' table is ready.");

    // Create the 'items' table with a foreign key linking to categories
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        price DECIMAL(15, 2) NOT NULL,
        quantity INT NOT NULL DEFAULT 0,
        category_id INT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id)
          ON DELETE SET NULL ON UPDATE CASCADE
      )
    `);
    console.log("-> 'items' table is ready.");

    // Clear existing data for a clean demo run
    await pool.execute('DELETE FROM items');
    await pool.execute('DELETE FROM categories');
    await pool.execute('ALTER TABLE categories AUTO_INCREMENT = 1');
    await pool.execute('ALTER TABLE items AUTO_INCREMENT = 1');

    // Insert categories using prepared statements
    const insertCatSql = `INSERT INTO categories (name, description) VALUES (?, ?)`;
    const [cat1] = await pool.execute(insertCatSql, ['Food', 'Daily essentials']);
    console.log(`-> Inserted category ID: ${cat1.insertId}`);

    const [cat2] = await pool.execute(insertCatSql, ['Electronics', 'Electronic devices and accessories']);
    console.log(`-> Inserted category ID: ${cat2.insertId}`);

    const [cat3] = await pool.execute(insertCatSql, ['Clothing', 'Apparel and fashion items']);
    console.log(`-> Inserted category ID: ${cat3.insertId}`);

    // Select data
    const [rows] = await pool.execute('SELECT * FROM categories WHERE name = ?', ['Food']);
    console.log('-> Query result:', rows);

    // Update data
    const [updateResult] = await pool.execute(
      'UPDATE categories SET description = ? WHERE id = ?',
      ['Food, beverages and fresh food', cat1.insertId]
    );
    console.log(`-> Number of updated rows: ${updateResult.affectedRows}`);

    // PART 2: Insert sample items for extended queries
    console.log('\n Inserting sample items');

    const insertItemSql = `INSERT INTO items (name, price, quantity, category_id) VALUES (?, ?, ?, ?)`;

    // Electronics (category_id = cat2.insertId)
    const electronicsId = cat2.insertId;
    await pool.execute(insertItemSql, ['Gaming Laptop ASUS ROG', 25000000, 5, electronicsId]);
    await pool.execute(insertItemSql, ['Wireless Mouse Logitech', 750000, 20, electronicsId]);
    await pool.execute(insertItemSql, ['Gaming Keyboard Razer', 2500000, 8, electronicsId]);
    await pool.execute(insertItemSql, ['Wireless Headphone Sony', 3500000, 12, electronicsId]);
    await pool.execute(insertItemSql, ['USB-C Hub Adapter', 450000, 30, electronicsId]);
    await pool.execute(insertItemSql, ['Gaming Monitor 27 inch', 8000000, 3, electronicsId]);

    // Food (category_id = cat1.insertId)
    const foodId = cat1.insertId;
    await pool.execute(insertItemSql, ['Premium Rice 10kg', 350000, 100, foodId]);
    await pool.execute(insertItemSql, ['Instant Noodles Box', 120000, 200, foodId]);
    await pool.execute(insertItemSql, ['Cooking Oil 5L', 280000, 50, foodId]);

    // Clothing (category_id = cat3.insertId)
    const clothingId = cat3.insertId;
    await pool.execute(insertItemSql, ['Winter Jacket', 1200000, 15, clothingId]);
    await pool.execute(insertItemSql, ['Running Shoes Nike', 3200000, 10, clothingId]);
    await pool.execute(insertItemSql, ['Cotton T-Shirt', 250000, 0, clothingId]);

    console.log('-> Inserted 12 sample items into 3 categories.');

    // Question 1: Filter & Sort
    // Retrieve products priced >= 500,000 VND AND quantity > 0,
    // sorted by price descending
    console.log('\n Question 1: Filter & Sort');
    const [q1Rows] = await pool.execute(
      'SELECT * FROM items WHERE price >= 500000 AND quantity > 0 ORDER BY price DESC'
    );
    console.log(`-> Products with price >= 500,000 VND and quantity > 0 (sorted by price DESC):`);
    console.table(q1Rows);

    // Question 2: Wildcard / LIKE search
    // Search for products by keyword using LIKE '%keyword%'
    console.log('\n Question 2: Wildcard / LIKE Search');

    async function searchByKeyword(keyword) {
      const searchPattern = `%${keyword}%`;
      const [results] = await pool.execute(
        'SELECT * FROM items WHERE name LIKE ?',
        [searchPattern]
      );
      console.log(`\n-> Search results for "${keyword}":`);
      console.table(results);
      return results;
    }

    // Search for "Gaming"
    await searchByKeyword('Gaming');

    // Search for "Wireless"
    await searchByKeyword('Wireless');

    // Question 3: Aggregate functions
    // SUM(quantity), AVG(price), COUNT(*)
    console.log('\n Question 3: Aggregate Functions');
    const [q3Rows] = await pool.execute(`
      SELECT
        SUM(quantity) AS total_stock_quantity,
        AVG(price) AS average_price,
        COUNT(*) AS total_items
      FROM items
    `);
    console.log('-> Aggregate statistics for the items table:');
    console.table(q3Rows);

    // Question 4: Category statistics - GROUP BY & HAVING
    // Total items and total inventory value per category
    // Only categories with inventory value > 10,000,000 VND
    console.log('\n Question 4: GROUP BY & HAVING');
    const [q4Rows] = await pool.execute(`
      SELECT
        c.name AS category_name,
        COUNT(i.id) AS total_items,
        SUM(i.price * i.quantity) AS total_inventory_value
      FROM items i
      JOIN categories c ON i.category_id = c.id
      GROUP BY c.id, c.name
      HAVING SUM(i.price * i.quantity) > 10000000
    `);
    console.log('-> Categories with total inventory value > 10,000,000 VND:');
    console.table(q4Rows);

  } catch (error) {
    console.error('MySQL error:', error.message);
  } finally {
    await pool.end(); // Close connection
    console.log('\n-> Connection pool closed.');
  }
}

main();
