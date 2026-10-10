/* Connects to MySQL (credentials from CLI args/env), creates the database and
   loads database/schema.sql. Idempotent. */
import fs from 'node:fs';
import path from 'node:path';
import mysql from 'mysql2/promise';

const host = process.env.DB_HOST || 'localhost';
const port = Number(process.env.DB_PORT || 3306);
const user = process.argv[2] || process.env.DB_USER || 'root';
const password = process.argv[3] ?? process.env.DB_PASSWORD ?? '';

const conn = await mysql.createConnection({
  host,
  port,
  user,
  password,
  multipleStatements: true,
  charset: 'utf8mb4',
});

const sql = fs.readFileSync(path.resolve('database/schema.sql'), 'utf8');
await conn.query(sql);
console.log('Schema applied successfully.');

const [rows] = await conn.query('SHOW TABLES');
console.log('Tables:', rows.map((r) => Object.values(r)[0]).join(', '));
await conn.end();
