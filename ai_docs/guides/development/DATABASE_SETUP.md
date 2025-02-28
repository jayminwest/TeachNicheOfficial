# Cloud SQL Database Setup Guide

This guide covers setting up and working with our Google Cloud SQL (PostgreSQL) database.

## Prerequisites
- Google Cloud account with proper permissions
- Cloud SQL Admin API enabled
- Cloud SQL Proxy installed locally
- PostgreSQL client (psql) or GUI tool

## Database Connection

### Local Development Setup
1. Install Cloud SQL Proxy:
```bash
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.6.1/cloud-sql-proxy.linux.amd64
chmod +x cloud-sql-proxy
```

2. Start the proxy:
```bash
./cloud-sql-proxy --port 5432 PROJECT_ID:REGION:INSTANCE_NAME
```

3. Connect using environment variables:
```typescript
// lib/db.ts
import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
});

export default pool;
```

### Production Connection
Use Cloud SQL Connector for Node.js:
```typescript
import { Pool } from 'pg';
import { Connector } from '@google-cloud/cloud-sql-connector';

const connector = new Connector();
const clientOpts = await connector.getOptions({
  instanceConnectionName: process.env.CLOUD_SQL_CONNECTION_NAME,
  ipType: 'PUBLIC',
});

const pool = new Pool({
  ...clientOpts,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});
```

## Database Migrations
We use Flyway for schema migrations:

1. Create migration file:
```
src/migrations/V2025.02.27.01__create_lessons_table.sql
```

2. Migration file example:
```sql
CREATE TABLE lessons (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  creator_id INT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

3. Run migrations:
```bash
flyway migrate -configFiles=flyway.conf
```

## Common Operations

### Query Execution
```typescript
import pool from '@/lib/db';

async function getLessons(userId: number) {
  const { rows } = await pool.query(
    'SELECT * FROM lessons WHERE creator_id = $1',
    [userId]
  );
  return rows;
}
```

### Transaction Handling
```typescript
async function createLesson(lessonData) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const lessonRes = await client.query(
      'INSERT INTO lessons(title, creator_id) VALUES($1, $2) RETURNING id',
      [lessonData.title, lessonData.creatorId]
    );
    
    await client.query(
      'INSERT INTO lesson_content(lesson_id, content) VALUES($1, $2)',
      [lessonRes.rows[0].id, lessonData.content]
    );
    
    await client.query('COMMIT');
    return lessonRes.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

## Best Practices
1. Always use parameterized queries to prevent SQL injection
2. Use connection pooling for better performance
3. Keep migrations idempotent and reversible
4. Maintain consistent naming conventions (snake_case for SQL)
5. Regularly vacuum and analyze tables in production
6. Use indexes judiciously for frequently queried columns

## Security Considerations
- Never commit credentials to source control
- Use IAM roles for service accounts
- Enable automatic backups
- Use SSL for all connections
- Regularly rotate database credentials

## Troubleshooting

| Error | Solution |
|-------|----------|
| Connection timeout | Verify Cloud SQL Proxy is running |
| Permission denied | Check IAM roles and database privileges |
| Too many connections | Increase connection pool size or optimize queries |
| Query timeout | Add indexes or optimize slow queries |
````
