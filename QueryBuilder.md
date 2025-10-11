# QueryBuilder Documentation

A flexible, type-safe query builder for MongoDB/Mongoose with built-in pagination, filtering, sorting, and search capabilities.

---

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Core Features](#core-features)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Best Practices](#best-practices)
- [Security](#security)

---

## Installation

```bash
npm install mongoose
```

Import the QueryBuilder:

```typescript
import { QueryBuilder, createQueryBuilder } from './path/to/query-builder';
```

---

## Quick Start

```typescript
import { User } from './models/User';
import { createQueryBuilder } from './query-builder';

// Initialize with configuration
const queryBuilder = createQueryBuilder({
  searchFields: ['name', 'email'],
  sortableFields: ['name', 'createdAt', 'age'],
  filterableFields: ['status', 'role', 'age'],
  defaultSort: '-createdAt',
  defaultLimit: 20,
  maxLimit: 100,
});

// Execute a query
const result = await queryBuilder.query(User, req.query).paginate().execute();

console.log(result.items); // Array of users
console.log(result.pagination); // Pagination info
```

---

## Configuration

### QueryConfig Interface

```typescript
interface QueryConfig {
  searchFields?: string[]; // Fields to search across
  sortableFields?: string[]; // Allowed fields for sorting
  selectableFields?: string[]; // Allowed fields for selection
  filterableFields?: string[]; // Allowed fields for filtering
  defaultSort?: string; // Default sort (e.g., '-createdAt')
  defaultLimit?: number; // Default page size (default: 20)
  maxLimit?: number; // Maximum page size (default: 100)
  enableTextSearch?: boolean; // Enable MongoDB text search
  queryTimeout?: number; // Query timeout in ms (default: 30000)
}
```

### Configuration Examples

**Minimal Configuration:**

```typescript
const qb = createQueryBuilder({
  searchFields: ['name', 'email'],
});
```

**Full Configuration:**

```typescript
const qb = createQueryBuilder({
  searchFields: ['name', 'email', 'username'],
  sortableFields: ['name', 'createdAt', 'updatedAt', 'age'],
  selectableFields: ['name', 'email', 'age', 'status'],
  filterableFields: ['status', 'role', 'age', 'isActive'],
  defaultSort: '-createdAt',
  defaultLimit: 25,
  maxLimit: 100,
  enableTextSearch: true,
  queryTimeout: 30000,
});
```

---

## Core Features

### 1. Pagination

```typescript
// With pagination
const result = await queryBuilder
  .query(User, { page: 2, limit: 10 })
  .paginate()
  .execute();

// Result structure
{
  items: [...], // Array of documents
  pagination: {
    page: 2,
    limit: 10,
    totalCount: 150,
    totalPages: 15,
    hasNext: true,
    hasPrev: true,
    startIndex: 11,
    endIndex: 20
  }
}
```

### 2. Sorting

```typescript
// Single field ascending
const users = await queryBuilder.query(User, { sort: 'name' }).execute();

// Single field descending
const users = await queryBuilder.query(User, { sort: '-createdAt' }).execute();

// Multiple fields
const users = await queryBuilder.query(User, { sort: 'status,-createdAt,name' }).execute();
```

### 3. Filtering

**Basic Filters:**

```typescript
// Exact match
const users = await queryBuilder.query(User, { status: 'active', role: 'admin' }).execute();
```

**Advanced Operators:**

```typescript
// Greater than / Less than
const users = await queryBuilder
  .query(User, {
    age: { gte: 18, lte: 65 },
    score: { gt: 80 },
  })
  .execute();

// In / Not In
const users = await queryBuilder
  .query(User, {
    status: { in: ['active', 'pending'] },
    role: { nin: ['admin', 'superadmin'] },
  })
  .execute();

// Not Equal
const users = await queryBuilder.query(User, { status: { ne: 'deleted' } }).execute();

// Exists
const users = await queryBuilder.query(User, { phoneNumber: { exists: true } }).execute();
```

### 4. Search

```typescript
// Search across configured fields
const users = await queryBuilder.query(User, { search: 'john' }).execute();
// Searches in: name, email (as configured)

// With MongoDB text search (if index exists)
const qb = createQueryBuilder({
  searchFields: ['name', 'email'],
  enableTextSearch: true,
});
```

### 5. Field Selection

```typescript
// Select specific fields
const users = await queryBuilder.query(User, { select: 'name,email,age' }).execute();

// Using .select() method
const users = await queryBuilder.query(User).select('name email').execute();

// Using .project() method
const users = await queryBuilder.query(User).project({ name: 1, email: 1, password: 0 }).execute();
```

### 6. Population

```typescript
// Simple populate
const posts = await queryBuilder.query(Post).populate('author').execute();

// Multiple populations
const posts = await queryBuilder.query(Post).populate(['author', 'comments']).execute();

// Advanced populate with options
const posts = await queryBuilder
  .query(Post)
  .populate({
    path: 'author',
    select: 'name email avatar',
    match: { isActive: true },
  })
  .execute();
```

---

## API Reference

### Query Initialization

#### `query(model, queryParams)`

Initialize a query with a Mongoose model and query parameters.

```typescript
queryBuilder.query(User, req.query);
```

### Query Modifiers

#### `paginate()`

Enable pagination for the query.

```typescript
.paginate()
```

#### `populate(fields)`

Populate related documents.

```typescript
.populate('author')
.populate(['author', 'comments'])
.populate({ path: 'author', select: 'name' })
```

#### `lean(useLean = true)`

Return plain JavaScript objects instead of Mongoose documents (faster, but no virtuals).

```typescript
.lean() // Enable
.lean(false) // Disable
```

#### `select(fields)`

Select specific fields to return.

```typescript
.select('name email age')
```

#### `project(fields)`

Use MongoDB projection syntax.

```typescript
.project({ name: 1, email: 1, password: 0 })
```

#### `where(filter)`

Add custom filter conditions.

```typescript
.where({ status: 'active' })
.where({ createdAt: { $gte: new Date('2024-01-01') } })
```

#### `hint(index)`

Provide query optimization hint.

```typescript
.hint({ email: 1 })
.hint('email_1_username_1')
```

#### `withCollation(collation)`

Add collation for case-insensitive operations.

```typescript
.withCollation({ locale: 'en', strength: 2 })
```

### Query Execution

#### `execute<T>()`

Execute the query and return results.

```typescript
const users = await queryBuilder.query(User).execute();
const result = await queryBuilder.query(User).paginate().execute();
```

#### `findOne<T>()`

Find a single document.

```typescript
const user = await queryBuilder.query(User, { email: 'john@example.com' }).findOne();
```

#### `count()`

Count documents matching the query.

```typescript
const count = await queryBuilder.query(User, { status: 'active' }).count();
```

#### `exists()`

Check if any documents exist.

```typescript
const hasUsers = await queryBuilder.query(User, { role: 'admin' }).exists();
```

### Query Inspection

#### `getQuery()`

Get parsed query without executing.

```typescript
const parsed = queryBuilder.query(User, req.query).getQuery();
console.log(parsed.filter); // MongoDB filter
console.log(parsed.sort); // Sort options
console.log(parsed.pagination); // Pagination info
```

#### `getFilter()`

Get only the filter object.

```typescript
const filter = queryBuilder.query(User, req.query).getFilter();
```

---

## Examples

### Example 1: Simple List API

```typescript
// GET /api/users?page=1&limit=20&sort=-createdAt
async function getUsers(req: Request, res: Response) {
  const qb = createQueryBuilder({
    sortableFields: ['name', 'createdAt', 'email'],
    defaultSort: '-createdAt',
    defaultLimit: 20,
  });

  const result = await qb.query(User, req.query).paginate().execute();

  res.json(result);
}
```

### Example 2: Search & Filter

```typescript
// GET /api/users?search=john&status=active&age[gte]=18
async function searchUsers(req: Request, res: Response) {
  const qb = createQueryBuilder({
    searchFields: ['name', 'email', 'username'],
    filterableFields: ['status', 'role', 'age'],
    sortableFields: ['name', 'createdAt'],
  });

  const users = await qb.query(User, req.query).execute();

  res.json(users);
}
```

### Example 3: Complex Query with Population

```typescript
// GET /api/posts?populate=author,comments&select=title,content,createdAt
async function getPosts(req: Request, res: Response) {
  const qb = createQueryBuilder({
    selectableFields: ['title', 'content', 'createdAt', 'author'],
    sortableFields: ['createdAt', 'title', 'views'],
  });

  const posts = await qb
    .query(Post, req.query)
    .populate([
      { path: 'author', select: 'name email avatar' },
      { path: 'comments', options: { limit: 5, sort: '-createdAt' } },
    ])
    .paginate()
    .execute();

  res.json(posts);
}
```

### Example 4: Custom Filters with Where

```typescript
// Get users created in the last 7 days
async function getRecentUsers(req: Request, res: Response) {
  const qb = createQueryBuilder();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const users = await qb
    .query(User, req.query)
    .where({ createdAt: { $gte: sevenDaysAgo } })
    .where({ isActive: true })
    .execute();

  res.json(users);
}
```

### Example 5: Performance Optimization

```typescript
// Optimized query with lean, hint, and specific fields
async function getOptimizedUsers(req: Request, res: Response) {
  const qb = createQueryBuilder({
    selectableFields: ['name', 'email', 'status'],
  });

  const users = await qb
    .query(User, req.query)
    .select('name email status')
    .lean() // Return plain objects (faster)
    .hint({ email: 1 }) // Use email index
    .paginate()
    .execute();

  res.json(users);
}
```

### Example 6: Reusable Query Builder Instance

```typescript
// Create a reusable instance
const userQueryBuilder = createQueryBuilder({
  searchFields: ['name', 'email', 'username'],
  sortableFields: ['name', 'createdAt', 'updatedAt', 'age'],
  filterableFields: ['status', 'role', 'isActive'],
  selectableFields: ['name', 'email', 'age', 'status', 'role'],
  defaultSort: '-createdAt',
  defaultLimit: 25,
  maxLimit: 100,
});

// Use in multiple endpoints
app.get('/api/users', async (req, res) => {
  const result = await userQueryBuilder.query(User, req.query).paginate().execute();
  res.json(result);
});

app.get('/api/users/active', async (req, res) => {
  const users = await userQueryBuilder.query(User, { ...req.query, status: 'active' }).execute();
  res.json(users);
});
```

### Example 7: TypeScript with Interfaces

```typescript
interface User {
  _id: string;
  name: string;
  email: string;
  age: number;
  status: 'active' | 'inactive';
}

interface UserQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  age?: { gte?: number; lte?: number };
}

async function getTypedUsers(params: UserQueryParams) {
  const qb = createQueryBuilder({
    searchFields: ['name', 'email'],
    filterableFields: ['status', 'age'],
  });

  const result = await qb.query(User, params).paginate().execute<User>();

  return result; // Typed as PaginatedData<User>
}
```

---

## Best Practices

### 1. **Always Configure Allowed Fields**

```typescript
// ✅ Good - Whitelist allowed fields
const qb = createQueryBuilder({
  sortableFields: ['name', 'createdAt'],
  filterableFields: ['status', 'role'],
  selectableFields: ['name', 'email', 'age'],
});

// ❌ Bad - No restrictions
const qb = createQueryBuilder({});
```

### 2. **Use Lean for Read-Only Operations**

```typescript
// ✅ Good - Use lean() for lists/searches
const users = await qb.query(User, req.query).lean().execute();

// ❌ Bad - Full Mongoose documents for simple reads
const users = await qb.query(User, req.query).execute();
```

### 3. **Set Reasonable Limits**

```typescript
// ✅ Good - Reasonable limits
const qb = createQueryBuilder({
  defaultLimit: 20,
  maxLimit: 100,
});

// ❌ Bad - No limit protection
const qb = createQueryBuilder({
  maxLimit: 10000, // Too high
});
```

### 4. **Use Indexes with Hints**

```typescript
// ✅ Good - Use index hints for known queries
const users = await qb
  .query(User, { status: 'active' })
  .hint({ status: 1, createdAt: -1 })
  .execute();
```

### 5. **Validate Input Before Querying**

```typescript
// ✅ Good - Validate first
function validateQueryParams(params: any) {
  if (params.age && (params.age < 0 || params.age > 150)) {
    throw new Error('Invalid age range');
  }
  return params;
}

const users = await qb.query(User, validateQueryParams(req.query)).execute();
```

### 6. **Handle Errors Properly**

```typescript
// ✅ Good - Proper error handling
try {
  const result = await qb.query(User, req.query).paginate().execute();
  res.json(result);
} catch (error) {
  if (error.message.includes('timeout')) {
    res.status(408).json({ error: 'Query timeout' });
  } else {
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

---

## Security

### Built-in Protections

1. **Query Timeout**: All queries have a 30-second timeout by default
2. **Regex Sanitization**: Search inputs are sanitized to prevent ReDoS attacks
3. **Array Size Limits**: `$in` and `$nin` operators limited to 1000 items
4. **Search Term Length**: Limited to 100 characters
5. **Field Whitelisting**: Only configured fields can be sorted/filtered/selected

### Security Best Practices

```typescript
// ✅ Always whitelist fields
const qb = createQueryBuilder({
  sortableFields: ['name', 'createdAt'], // Only these can be sorted
  filterableFields: ['status', 'role'], // Only these can be filtered
});

// ✅ Set appropriate timeout
const qb = createQueryBuilder({
  queryTimeout: 15000, // 15 seconds for faster endpoints
});

// ✅ Validate sensitive filters
app.get('/api/users', async (req, res) => {
  // Don't allow filtering by password or sensitive fields
  const { password, secret, ...safeQuery } = req.query;

  const result = await qb.query(User, safeQuery).execute();
});
```

---

## Query Parameter Format

### URL Query Examples

```bash
# Pagination
GET /api/users?page=2&limit=50

# Sorting
GET /api/users?sort=-createdAt,name

# Search
GET /api/users?search=john

# Filtering
GET /api/users?status=active&role=admin

# Range filters
GET /api/users?age[gte]=18&age[lte]=65

# Array filters
GET /api/users?status[in]=active,pending

# Field selection
GET /api/users?select=name,email,age

# Combined
GET /api/users?search=john&status=active&age[gte]=18&sort=-createdAt&page=1&limit=20&select=name,email
```

### Operator Reference

| Operator | MongoDB   | Example                      | Description           |
| -------- | --------- | ---------------------------- | --------------------- |
| `gte`    | `$gte`    | `age[gte]=18`                | Greater than or equal |
| `lte`    | `$lte`    | `age[lte]=65`                | Less than or equal    |
| `gt`     | `$gt`     | `score[gt]=80`               | Greater than          |
| `lt`     | `$lt`     | `score[lt]=100`              | Less than             |
| `ne`     | `$ne`     | `status[ne]=deleted`         | Not equal             |
| `in`     | `$in`     | `role[in]=admin,user`        | In array              |
| `nin`    | `$nin`    | `status[nin]=banned,deleted` | Not in array          |
| `eq`     | `$eq`     | `status[eq]=active`          | Equals                |
| `exists` | `$exists` | `phone[exists]=true`         | Field exists          |

---

## Troubleshooting

### Query Timeout Errors

```typescript
// Increase timeout for slow queries
const qb = createQueryBuilder({
  queryTimeout: 60000, // 60 seconds
});
```

### Population Not Working with Lean

```typescript
// ❌ Virtuals won't work with lean
const posts = await qb
  .query(Post)
  .populate('author')
  .lean() // Virtuals on author won't be included
  .execute();

// ✅ Remove lean if you need virtuals
const posts = await qb.query(Post).populate('author').execute();
```

### No Results with Strict Filtering

```typescript
// Check if fields are whitelisted
const qb = createQueryBuilder({
  filterableFields: ['status'], // Only status allowed
});

// This won't filter by 'role' because it's not whitelisted
const users = await qb.query(User, { status: 'active', role: 'admin' }).execute();
```

---

## License

MIT

---

## Support

For issues and questions, please open an issue on the repository.
