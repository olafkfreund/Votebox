# Votebox Development Setup

This guide will help you set up your local development environment for Votebox.

## Prerequisites

### Required Software

- **Node.js** 20.x or later ([Download](https://nodejs.org/))
- **Docker** & **Docker Compose** ([Download](https://www.docker.com/))
- **Git** ([Download](https://git-scm.com/))

### Optional but Recommended

- **VS Code** with extensions:
  - ESLint
  - Prettier
  - Prisma
  - Docker
  - TypeScript
- **Postman** or **Insomnia** for API testing
- **Redis CLI** for debugging cache
- **pgAdmin** or **DBeaver** for database management

### Accounts Needed

1. **Spotify Developer Account** ([Register](https://developer.spotify.com/))
   - Create an app
   - Note your Client ID and Client Secret
   - Add redirect URI: `http://localhost:3000/auth/spotify/callback`

2. **GitHub Account** (for version control and CI/CD)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/votebox.git
cd votebox
```

### 2. Install Dependencies

We use a monorepo structure with Turborepo:

```bash
# Install all dependencies
npm install

# Or if you prefer using pnpm
pnpm install
```

### 3. Set Up Environment Variables

Create `.env` files in the root and apps:

```bash
# Root .env (for Docker Compose)
cp .env.example .env

# API .env
cp apps/api/.env.example apps/api/.env

# Web .env
cp apps/web/.env.example apps/web/.env

# Admin .env
cp apps/admin/.env.example apps/admin/.env
```

Edit `.env` files with your configuration:

#### Root `.env`

```env
# PostgreSQL
POSTGRES_USER=votebox
POSTGRES_PASSWORD=votebox_dev_password
POSTGRES_DB=votebox_dev
POSTGRES_PORT=5432

# Redis
REDIS_PASSWORD=votebox_redis_password
REDIS_PORT=6379
```

#### `apps/api/.env`

```env
# Application
NODE_ENV=development
PORT=4000

# Database
DATABASE_URL="postgresql://votebox:votebox_dev_password@localhost:5432/votebox_dev?schema=public"

# Redis
REDIS_URL="redis://:votebox_redis_password@localhost:6379"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-this-too"
JWT_REFRESH_EXPIRES_IN=30d

# Spotify API
SPOTIFY_CLIENT_ID="your-spotify-client-id"
SPOTIFY_CLIENT_SECRET="your-spotify-client-secret"
SPOTIFY_REDIRECT_URI="http://localhost:3000/auth/spotify/callback"

# CORS
CORS_ORIGIN="http://localhost:3000,http://localhost:3001"

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100
```

#### `apps/web/.env`

```env
# API
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000

# Environment
NODE_ENV=development
```

### 4. Start Infrastructure Services

Start PostgreSQL and Redis using Docker Compose:

```bash
docker-compose up -d postgres redis
```

Verify services are running:

```bash
docker-compose ps
```

You should see:

```
NAME                STATUS              PORTS
votebox-postgres    Up                  0.0.0.0:5432->5432/tcp
votebox-redis       Up                  0.0.0.0:6379->6379/tcp
```

### 5. Set Up Database

Initialize the database schema and seed data:

```bash
# Navigate to API directory
cd apps/api

# Run Prisma migrations
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate

# Seed database with demo data
npm run db:seed

# Back to root
cd ../..
```

### 6. Start Development Servers

Start all applications in development mode:

```bash
# Start all apps with hot reload
npm run dev
```

This will start:

- **API**: http://localhost:4000
- **Web (Guest/Display)**: http://localhost:3000
- **Admin Dashboard**: http://localhost:3001

### 7. Verify Installation

#### Check API Health

```bash
curl http://localhost:4000/health
```

Expected response:

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime": 123,
  "timestamp": "2026-01-20T10:00:00.000Z"
}
```

#### Open Applications

- **Guest App**: http://localhost:3000
- **Admin Dashboard**: http://localhost:3001/admin/login
  - Email: `owner@ravensclaw.com`
  - Password: `demo123`
- **API Documentation**: http://localhost:4000/api/docs (Swagger)

## 🛠️ Development Workflow

### Running Individual Apps

```bash
# Run only API
npm run dev --workspace=apps/api

# Run only Web app
npm run dev --workspace=apps/web

# Run only Admin app
npm run dev --workspace=apps/admin
```

### Database Operations

#### View Database with Prisma Studio

```bash
cd apps/api
npx prisma studio
```

Opens: http://localhost:5555

#### Create a New Migration

```bash
cd apps/api

# After modifying schema.prisma
npx prisma migrate dev --name add_new_feature
```

#### Reset Database (⚠️ Deletes all data)

```bash
cd apps/api
npx prisma migrate reset
```

#### Apply Migrations to Database

```bash
cd apps/api
npx prisma migrate deploy
```

### Debugging

#### Debug API with VS Code

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug API",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/apps/api/src/main.ts",
      "preLaunchTask": "tsc: build - apps/api",
      "outFiles": ["${workspaceFolder}/apps/api/dist/**/*.js"],
      "env": {
        "NODE_ENV": "development"
      }
    }
  ]
}
```

#### Debug Next.js Apps

Next.js apps include built-in debugging. Just set breakpoints in VS Code and run:

```bash
npm run dev --workspace=apps/web
```

#### View Logs

```bash
# View API logs
docker-compose logs -f api

# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f postgres
docker-compose logs -f redis
```

### Testing

#### Run All Tests

```bash
npm run test
```

#### Run Tests for Specific App

```bash
npm run test --workspace=apps/api
```

#### Run Tests in Watch Mode

```bash
npm run test:watch
```

#### Run E2E Tests

```bash
npm run test:e2e
```

#### Generate Coverage Report

```bash
npm run test:cov
```

Coverage report available at: `coverage/lcov-report/index.html`

### Code Quality

#### Lint Code

```bash
npm run lint
```

#### Fix Linting Issues

```bash
npm run lint:fix
```

#### Format Code

```bash
npm run format
```

#### Type Check

```bash
npm run type-check
```

### Building

#### Build All Apps

```bash
npm run build
```

#### Build Specific App

```bash
npm run build --workspace=apps/api
```

## 🔧 Common Issues & Solutions

### Issue: Database Connection Error

**Error**: `Can't reach database server`

**Solution**:

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Restart PostgreSQL
docker-compose restart postgres

# Check logs
docker-compose logs postgres
```

### Issue: Redis Connection Error

**Error**: `ECONNREFUSED 127.0.0.1:6379`

**Solution**:

```bash
# Check if Redis is running
docker-compose ps redis

# Restart Redis
docker-compose restart redis

# Test connection
redis-cli -h localhost -p 6379 -a votebox_redis_password ping
```

### Issue: Port Already in Use

**Error**: `Port 4000 is already in use`

**Solution**:

```bash
# Find process using port
lsof -i :4000

# Kill process (replace PID with actual process ID)
kill -9 PID

# Or use different port in .env
PORT=4001
```

### Issue: Prisma Client Not Generated

**Error**: `@prisma/client did not initialize yet`

**Solution**:

```bash
cd apps/api
npx prisma generate
```

### Issue: Node Modules Sync Issues

**Error**: Various module resolution errors

**Solution**:

```bash
# Clean install
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf packages/*/node_modules
rm package-lock.json

npm install
```

### Issue: Spotify API 429 Rate Limit

**Error**: `Rate limit exceeded`

**Solution**:

- Implement caching (already done in code)
- Wait a few minutes
- Use multiple Spotify API keys (advanced)

## 🐳 Docker Development

### Start Everything with Docker

```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Rebuild Specific Service

```bash
docker-compose up -d --build api
```

### Access Container Shell

```bash
# API container
docker-compose exec api sh

# Database container
docker-compose exec postgres psql -U votebox -d votebox_dev
```

## 📦 Package Management

### Add New Dependency

```bash
# To specific app
npm install <package> --workspace=apps/api

# To shared package
npm install <package> --workspace=packages/ui

# To root (build tools, etc.)
npm install <package> --save-dev
```

### Update Dependencies

```bash
# Check for updates
npm outdated

# Update all dependencies
npm update

# Update specific package
npm update <package>
```

## 🔐 Security

### Generate New Secrets

```bash
# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate refresh token secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Environment Variable Validation

The API validates required environment variables on startup. If any are missing, it will fail with a clear error message.

## 🎨 VS Code Configuration

Create `.vscode/settings.json`:

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "[prisma]": {
    "editor.defaultFormatter": "Prisma.prisma"
  }
}
```

## 📚 Additional Resources

### Documentation

- [NestJS Documentation](https://docs.nestjs.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Socket.io Documentation](https://socket.io/docs)

### Tutorials

- [Building Real-time Apps with Socket.io](https://socket.io/get-started/chat)
- [Next.js App Router Tutorial](https://nextjs.org/learn)
- [Prisma Quickstart](https://www.prisma.io/docs/getting-started/quickstart)

### Community

- [Votebox GitHub Discussions](https://github.com/yourusername/votebox/discussions)
- [NestJS Discord](https://discord.gg/nestjs)
- [Prisma Slack](https://slack.prisma.io/)

## 🎯 Next Steps

1. ✅ Complete local setup
2. 📖 Read [CLAUDE.md](./CLAUDE.md) for development guidelines
3. 🏗️ Review [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
4. 📋 Check [PROJECT_PLAN.md](./PROJECT_PLAN.md) for current sprint tasks
5. 🚀 Start building!

## 💡 Tips for Success

- **Commit Early, Commit Often**: Make small, focused commits
- **Write Tests**: Aim for 80% coverage
- **Document Changes**: Update docs when adding features
- **Use TypeScript Properly**: Avoid `any`, use strict types
- **Follow Conventions**: Consistent code style matters
- **Ask for Help**: Use GitHub Discussions for questions

---

**Happy Coding!** 🎉

If you encounter any issues not covered here, please:

1. Check existing GitHub Issues
2. Search documentation
3. Ask in GitHub Discussions
4. Create a new issue with detailed information

**Last Updated**: January 2026
