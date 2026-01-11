# Votebox Testing Guide

## Week 1 Development Setup Testing Checklist

This document provides a comprehensive checklist to verify that the Week 1 foundation is working correctly.

## Prerequisites

- Node.js 20+ installed
- Docker & Docker Compose installed
- Git repository cloned
- All dependencies installed (`npm install`)

---

## 1. Infrastructure Tests

### ✅ Docker Services

```bash
# Start services
docker-compose up -d postgres redis

# Verify services are running
docker-compose ps

# Expected output:
# votebox-postgres   Up (healthy)
# votebox-redis      Up (healthy)
```

**Success Criteria:**

- [ ] PostgreSQL container running and healthy
- [ ] Redis container running and healthy
- [ ] No error messages in logs

### ✅ Database Connection

```bash
# Test PostgreSQL connection
docker exec -it votebox-postgres psql -U votebox -d votebox_dev -c "SELECT 1;"

# Expected output: should return 1
```

**Success Criteria:**

- [ ] Can connect to PostgreSQL
- [ ] Database `votebox_dev` exists

---

## 2. Database Migrations

### ✅ Run Migrations

```bash
cd packages/database
npx prisma migrate dev --name init
```

**Success Criteria:**

- [ ] Migration runs without errors
- [ ] All 11 tables created
- [ ] Prisma Client generated

### ✅ Verify Schema

```bash
# Open Prisma Studio
npx prisma studio
```

**Success Criteria:**

- [ ] Prisma Studio opens at http://localhost:5555
- [ ] All 11 models visible (Venue, User, Event, Vote, QueueItem, PlayHistory, Session, Subscription, Invoice, VenueMetrics)
- [ ] No data yet (empty tables)

### ✅ Seed Database

```bash
npm run db:seed
```

**Success Criteria:**

- [ ] Seed script runs successfully
- [ ] Demo venue created
- [ ] Test event created
- [ ] Can view data in Prisma Studio

---

## 3. Backend API Tests

### ✅ Build API

```bash
cd apps/api
npm run build
```

**Success Criteria:**

- [ ] TypeScript compiles without errors
- [ ] `dist/` folder created
- [ ] No build warnings

### ✅ Start API Server

```bash
# Start in development mode
npm run dev
```

**Success Criteria:**

- [ ] Server starts on port 4000
- [ ] No startup errors
- [ ] Console shows: "🚀 API server running"

### ✅ Test Health Endpoints

```bash
# Basic health check
curl http://localhost:4000/api/v1/health

# Expected: {"status":"ok","timestamp":"...","service":"votebox-api","version":"0.1.0"}

# Readiness check (with DB)
curl http://localhost:4000/api/v1/health/ready

# Expected: {"status":"ready","timestamp":"...","checks":{"database":true,"redis":true}}

# Liveness check
curl http://localhost:4000/api/v1/health/live

# Expected: {"status":"alive","timestamp":"...","uptime":123.456,"memory":{...}}
```

**Success Criteria:**

- [ ] `/health` returns status "ok"
- [ ] `/health/ready` shows database: true, redis: true
- [ ] `/health/live` shows uptime and memory stats

### ✅ API Documentation

Open http://localhost:4000/api/docs

**Success Criteria:**

- [ ] Swagger UI loads
- [ ] Health endpoints documented
- [ ] API title shows "Votebox API"

---

## 4. Frontend Web App Tests

### ✅ Build Web App

```bash
cd apps/web
npm run build
```

**Success Criteria:**

- [ ] Next.js builds successfully
- [ ] `.next/` folder created
- [ ] No build errors

### ✅ Start Web App

```bash
npm run dev
```

**Success Criteria:**

- [ ] Server starts on port 3000
- [ ] No startup errors
- [ ] Console shows compilation success

### ✅ Test Web Pages

Open http://localhost:3000

**Success Criteria:**

- [ ] Landing page loads
- [ ] Shows "🎵 Votebox" heading
- [ ] "Try Demo" and "Learn More" buttons visible
- [ ] No console errors
- [ ] Page is responsive

---

## 5. Admin Dashboard Tests

### ✅ Build Admin App

```bash
cd apps/admin
npm run build
```

**Success Criteria:**

- [ ] Next.js builds successfully
- [ ] `.next/` folder created
- [ ] No build errors

### ✅ Start Admin App

```bash
npm run dev
```

**Success Criteria:**

- [ ] Server starts on port 3001
- [ ] No startup errors
- [ ] Console shows compilation success

### ✅ Test Admin Pages

Open http://localhost:3001

**Success Criteria:**

- [ ] Landing page loads with "🎵 Votebox Admin"
- [ ] "Sign In" button visible
- [ ] Feature cards displayed

Open http://localhost:3001/login

**Success Criteria:**

- [ ] Login page loads
- [ ] Email and password fields visible
- [ ] Demo credentials shown
- [ ] No console errors

---

## 6. Integration Tests

### ✅ Full Stack Test

With all services running:

1. **PostgreSQL**: `docker-compose ps postgres` → healthy
2. **Redis**: `docker-compose ps redis` → healthy
3. **API**: http://localhost:4000/api/v1/health → "ok"
4. **Web**: http://localhost:3000 → loads
5. **Admin**: http://localhost:3001 → loads

**Success Criteria:**

- [ ] All services running simultaneously
- [ ] No port conflicts
- [ ] All pages accessible

### ✅ Hot Reload Test

1. Edit `apps/web/app/page.tsx` (change heading text)
2. Save file
3. Check browser (should auto-reload)

**Success Criteria:**

- [ ] Changes reflect immediately
- [ ] No manual refresh needed
- [ ] No errors in console

---

## 7. Code Quality Tests

### ✅ Linting

```bash
# From project root
npm run lint
```

**Success Criteria:**

- [ ] Linter runs across all apps
- [ ] No linting errors
- [ ] Warnings are acceptable

### ✅ Type Checking

```bash
# Check TypeScript compilation
cd apps/api && npx tsc --noEmit
cd apps/web && npx tsc --noEmit
cd apps/admin && npx tsc --noEmit
```

**Success Criteria:**

- [ ] All TypeScript compiles without errors
- [ ] Types are correctly inferred

### ✅ Formatting

```bash
npm run format:check
```

**Success Criteria:**

- [ ] All files formatted correctly
- [ ] No formatting issues

---

## 8. CI/CD Tests

### ✅ GitHub Actions

Push code to GitHub and check:

https://github.com/olafkfreund/Votebox/actions

**Success Criteria:**

- [ ] CI workflow triggers
- [ ] Lint step passes
- [ ] Test step passes
- [ ] Build step passes
- [ ] All jobs green ✅

---

## 9. Docker Build Tests

### ✅ Build Docker Images

```bash
# Build API image
docker build -f docker/Dockerfile.api -t votebox-api:test .

# Build Web image
docker build -f docker/Dockerfile.web -t votebox-web:test .

# Build Admin image
docker build -f docker/Dockerfile.admin -t votebox-admin:test .
```

**Success Criteria:**

- [ ] All images build successfully
- [ ] No build errors
- [ ] Images are created

---

## 10. Performance Tests

### ✅ API Performance

```bash
# Install Apache Bench (if needed)
# Ubuntu: sudo apt-get install apache2-utils
# macOS: (included by default)

# Test health endpoint
ab -n 1000 -c 10 http://localhost:4000/api/v1/health
```

**Success Criteria:**

- [ ] 1000 requests complete
- [ ] 0% failed requests
- [ ] Mean response time < 500ms

---

## Week 1 Completion Checklist

### Infrastructure (3/3)

- [x] Docker services running
- [x] Database connected
- [x] Redis connected

### Backend (4/4)

- [x] API builds successfully
- [x] API starts without errors
- [x] Health endpoints working
- [x] Swagger documentation accessible

### Frontend (6/6)

- [x] Web app builds
- [x] Web app loads
- [x] Admin app builds
- [x] Admin app loads
- [x] All pages accessible
- [x] No console errors

### Database (3/3)

- [x] Migrations run
- [x] Schema created
- [x] Seed data loaded

### Code Quality (3/3)

- [x] Linting passes
- [x] Types valid
- [x] Formatting correct

### CI/CD (1/1)

- [x] GitHub Actions passing

---

## Summary

**Total Tests**: 20 categories
**Week 1 Status**: Foundation Complete

### Next Steps

Once all tests pass:

1. ✅ Week 1 is complete
2. ➡️ Ready for Week 2 development
3. 📋 Begin implementing backend services

---

**Last Updated**: January 2026
**Testing Framework**: Manual + CI/CD
**Maintainer**: Olaf Kfreund
