# Votebox Database Package

This package contains the Prisma schema, migrations, and database utilities for Votebox.

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Environment Variables
Create a `.env` file in the project root:
```env
DATABASE_URL="postgresql://votebox:votebox_dev_password@localhost:5432/votebox_dev"
```

### 3. Start PostgreSQL
```bash
docker-compose up -d postgres
```

### 4. Run Migrations
```bash
# From project root
cd packages/database

# Create and run migration
npx prisma migrate dev --name init

# Or from project root
npm run db:migrate
```

### 5. Generate Prisma Client
```bash
npx prisma generate
```

### 6. Seed Database (Optional)
```bash
npm run db:seed
```

This creates:
- Demo venue: `demo-venue`
  - Email: demo@votebox.com
  - Password: DemoVenue123!
- Test event: "Doom Rock Night"

## Database Schema

The database includes the following models:
- **Venue**: Venue information and Spotify integration
- **User**: Venue staff and admins
- **Event**: Music voting events
- **Vote**: Individual guest votes
- **QueueItem**: Current event queue
- **PlayHistory**: Played tracks history
- **Session**: Guest session tracking
- **Subscription**: Billing and subscription info
- **Invoice**: Payment records
- **VenueMetrics**: Analytics data

See `prisma/schema.prisma` for complete schema.

## Common Commands

```bash
# Open Prisma Studio (GUI)
npx prisma studio

# Create a new migration
npx prisma migrate dev --name <migration-name>

# Deploy migrations to production
npx prisma migrate deploy

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Generate Prisma Client
npx prisma generate

# Format schema file
npx prisma format

# Validate schema
npx prisma validate
```

## Migrations

Migrations are stored in `prisma/migrations/`. Each migration is a folder containing:
- `migration.sql` - The SQL migration file
- Timestamp and name in folder name

### Creating a New Migration

1. Modify `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name <description>`
3. Prisma will:
   - Generate SQL
   - Apply to database
   - Update Prisma Client

### Migration Best Practices

- **Name migrations descriptively**: `add_user_roles`, `create_analytics_table`
- **Review generated SQL** before applying
- **Test migrations** on development database first
- **Never edit** existing migrations that have been deployed
- **Commit migrations** to version control

## Troubleshooting

### Connection Issues
```bash
# Test connection
npx prisma db pull

# Check PostgreSQL is running
docker-compose ps postgres
```

### Migration Conflicts
```bash
# Reset and re-migrate (development only!)
npx prisma migrate reset
npx prisma migrate dev
```

### Out of Sync
```bash
# Generate client from current schema
npx prisma generate

# Push schema without migration (development)
npx prisma db push
```

## Production Deployment

```bash
# 1. Set production DATABASE_URL
export DATABASE_URL="postgresql://..."

# 2. Deploy migrations
npx prisma migrate deploy

# 3. Generate client
npx prisma generate
```

## Schema Updates

When updating the schema:

1. Edit `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name <description>`
3. Commit the migration folder
4. Update TypeScript types if needed
5. Test the changes

## Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Prisma Studio](https://www.prisma.io/docs/concepts/components/prisma-studio)
