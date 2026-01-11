# Votebox Setup Guide

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- Git

### Installation

1. **Clone and install dependencies**

```bash
git clone https://github.com/olafkfreund/Votebox.git
cd Votebox
npm install
```

2. **Set up environment variables**

```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start infrastructure**

```bash
docker-compose up -d postgres redis
```

4. **Run database migrations**

```bash
cd packages/database
npx prisma migrate dev --name init
npx prisma generate
```

5. **Seed the database (optional)**

```bash
npm run db:seed
```

6. **Start development servers**

```bash
# From project root
npm run dev
```

This will start:

- API: http://localhost:4000
- Web: http://localhost:3000
- API Docs: http://localhost:4000/api/docs

## Development Workflow

### Run all services with Docker

```bash
docker-compose up
```

### Run services individually

```bash
# Terminal 1 - API
cd apps/api
npm run dev

# Terminal 2 - Web
cd apps/web
npm run dev
```

### Database operations

```bash
# Create a new migration
npm run db:migrate

# Open Prisma Studio
npm run db:studio

# Seed database
npm run db:seed
```

### Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:ci
```

### Linting and Formatting

```bash
# Lint
npm run lint

# Format code
npm run format

# Check formatting
npm run format:check
```

## Project Structure

```
votebox/
├── apps/
│   ├── web/                  # Next.js PWA (Guest + Display)
│   ├── admin/                # Next.js Admin Dashboard (TODO)
│   └── api/                  # NestJS Backend API
├── packages/
│   ├── database/             # Prisma schema and migrations
│   ├── types/                # Shared TypeScript types
│   ├── config/               # Shared configurations
│   └── utils/                # Shared utilities (TODO)
├── docker/                   # Dockerfiles
├── .github/workflows/        # CI/CD pipelines
└── docs/                     # Documentation
```

## Troubleshooting

### Port conflicts

If ports 3000, 4000, 5432, or 6379 are in use:

```bash
# Check what's using the ports
lsof -i :3000
lsof -i :4000
lsof -i :5432
lsof -i :6379

# Kill the process or change ports in .env
```

### Database connection issues

```bash
# Reset database
docker-compose down -v
docker-compose up -d postgres
npm run db:migrate
```

### Node modules issues

```bash
# Clean install
npm run clean
rm -rf node_modules
npm install
```

## Next Steps

1. Review [PROJECT_PLAN.md](./PROJECT_PLAN.md) for development roadmap
2. Check [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
3. Read [API_DESIGN.md](./API_DESIGN.md) for API specifications
4. See [CLAUDE.md](./CLAUDE.md) for AI assistant guidelines

## Week 1 Checklist

- [x] Monorepo structure with Turborepo
- [x] Package.json and workspace configuration
- [x] Next.js web app setup
- [x] NestJS backend API setup
- [x] Shared packages (types, database, config)
- [x] Prisma with PostgreSQL schema
- [x] Docker Compose configuration
- [x] Dockerfiles for all apps
- [x] TypeScript, ESLint, Prettier configs
- [x] GitHub Actions CI/CD workflow
- [x] Health check endpoints
- [ ] Admin dashboard (Next up!)
- [ ] Database migration execution
- [ ] Complete development setup test

---

**Need help?** Check the documentation or open an issue on GitHub.
