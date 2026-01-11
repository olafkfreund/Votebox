# Votebox 🎵

<div align="center">

**Democratic Music Selection for Venues**

[![CI](https://github.com/olafkfreund/Votebox/actions/workflows/ci.yml/badge.svg)](https://github.com/olafkfreund/Votebox/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10-red.svg)](https://nestjs.com/)

[Documentation](./DOCUMENTATION_INDEX.md) • [Architecture](./ARCHITECTURE.md) • [Project Plan](./PROJECT_PLAN.md) • [Issues](https://github.com/olafkfreund/Votebox/issues)

</div>

---

## 📖 Overview

Votebox is a cloud-native SaaS platform that transforms the music experience in pubs, clubs, and venues by enabling guests to democratically vote on music from their phones in real-time. Venues create themed events (e.g., "Doom Rock Night", "90s Hip-Hop Session") and guests vote on tracks from curated playlists or genres, creating an engaging and interactive atmosphere.

**🎯 Current Status**: Week 1-4 MVP Complete - [View Progress](https://github.com/olafkfreund/Votebox/issues)

### 🎪 The Problem We're Solving

- **Venues** struggle to keep everyone happy with music selection
- **DJs/Staff** face constant requests and interruptions
- **Guests** feel disconnected from the music experience
- **Traditional jukeboxes** are outdated and limited
- **Existing solutions** lack real-time engagement and venue control

### 💡 Our Solution

Votebox bridges the gap by:

- ✅ Giving guests a voice through democratic voting
- ✅ Maintaining venue control with themed events and filters
- ✅ Providing real-time updates via WebSocket technology
- ✅ Offering actionable insights through analytics
- ✅ Requiring no app installation (PWA-based)

---

## 🎯 Project Goals & Objectives

### Primary Goals

1. **Create Engagement** - Transform passive listeners into active participants
2. **Enhance Experience** - Improve guest satisfaction and venue atmosphere
3. **Provide Control** - Give venues full control over music selection boundaries
4. **Generate Insights** - Help venues understand customer preferences
5. **Scale Efficiently** - Build a multi-tenant SaaS platform for unlimited venues

### Business Objectives

- **MVP Launch**: 12 weeks (3 months)
- **Target Market**: Pubs, bars, clubs, music venues in UK/Europe
- **Revenue Model**: Subscription tiers (£29-£199/month)
- **Success Metrics**:
  - 50+ venues by Month 6
  - £3,000+ MRR by Month 6
  - <10% churn rate
  - 99.5% uptime

### Technical Objectives

- **Performance**: <500ms API response time (p95)
- **Real-time**: <100ms WebSocket latency
- **Scalability**: Support 500+ concurrent voters per event
- **Reliability**: 99.5% uptime SLA
- **Security**: OWASP Top 10 compliance

---

## ✨ Key Features

### 🎤 For Venues

- **Event Management** - Schedule themed music nights with specific genres/playlists
- **Smart Queue System** - Weighted voting algorithm considers recency, diversity, and vote count
- **Admin Dashboard** - Real-time monitoring, manual controls, emergency skip
- **Analytics Dashboard** - Popular tracks, peak voting times, genre preferences
- **Content Moderation** - Explicit content filters, track blacklist, manual queue control
- **Spotify Integration** - OAuth authentication, playlist access, playback control
- **Subscription Management** - Multiple tiers (Free, Starter, Pro, Enterprise)

### 📱 For Guests

- **Instant Access** - Scan QR code → vote immediately (no app install required)
- **Real-time Updates** - See current track, upcoming queue, vote counts
- **Vote Power** - 3 votes per hour, influence the playlist democratically
- **Track Discovery** - Browse by genre, search tracks, see recommendations
- **Vote Cooldown** - Fair voting with anti-spam measures
- **Session Tracking** - Continue voting throughout the event

### 📺 For Display Screens

- **Now Playing** - Beautiful full-screen display with album art
- **Queue Visualization** - Upcoming tracks with vote counts and progress
- **Engagement Stats** - Most voted tracks, active voters, participation rate
- **Venue Branding** - Custom colors, logos, themes
- **QR Code Display** - Easy access for new guests

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Internet                                 │
└────────────────┬────────────────────────────────┬────────────────┘
                 │                                │
        ┌────────▼────────┐              ┌───────▼────────┐
        │   Next.js PWA    │              │   NestJS API   │
        │  Guest + Display │◄────────────►│  REST + WS     │
        └──────────────────┘              └────────┬───────┘
                                                   │
                                          ┌────────┴────────┐
                                          │                 │
                                    ┌─────▼──────┐   ┌─────▼──────┐
                                    │ PostgreSQL │   │   Redis    │
                                    └────────────┘   └────────────┘
                                          │
                                    ┌─────▼──────┐
                                    │  Spotify   │
                                    │    API     │
                                    └────────────┘
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed system design.

---

## 🚀 Tech Stack

### Frontend

- **Framework**: Next.js 14 (App Router) with React 18
- **Language**: TypeScript 5.3
- **Styling**: Tailwind CSS 4.0
- **State**: Zustand
- **Real-time**: Socket.io Client
- **PWA**: Service Workers, Web App Manifest

### Backend

- **Framework**: NestJS 10
- **Language**: TypeScript 5.3
- **Database**: PostgreSQL 16 with Prisma ORM
- **Cache**: Redis 7
- **Real-time**: Socket.io Server
- **Authentication**: JWT with Passport

### Infrastructure

- **Containers**: Docker & Docker Compose
- **CI/CD**: GitHub Actions
- **Orchestration**: Kubernetes (optional)
- **Monitoring**: Prometheus + Grafana
- **Cloud**: AWS/Azure/GCP ready

### External APIs

- **Music**: Spotify Web API + Web Playback SDK
- **Payments**: Stripe (Phase 3)

See [TECH_STACK.md](./TECH_STACK.md) for detailed rationale.

---

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** 20.x or later
- **Docker** & Docker Compose
- **Git** for version control
- **Spotify Developer Account** ([Get one here](https://developer.spotify.com/dashboard))
- **Code Editor** (VS Code recommended)

### NixOS Users

Using NixOS? We have full Nix flake support! See [docs/NIXOS.md](./docs/NIXOS.md) for NixOS-specific instructions.

**Quick start for NixOS:**

```bash
cd Votebox
nix develop  # or use direnv
```

All dependencies including Playwright browsers are provided via Nix!

---

## 🛠️ Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/olafkfreund/Votebox.git
cd Votebox
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Database
DATABASE_URL="postgresql://votebox:votebox_dev_password@localhost:5432/votebox_dev"

# Redis
REDIS_URL="redis://:votebox_redis_password@localhost:6379"

# Spotify
SPOTIFY_CLIENT_ID="your_spotify_client_id"
SPOTIFY_CLIENT_SECRET="your_spotify_client_secret"

# JWT
JWT_SECRET="your_secure_random_secret"
```

### 4. Start Infrastructure

```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis
```

### 5. Run Database Migrations

```bash
cd packages/database
npx prisma migrate dev --name init
npx prisma generate
cd ../..
```

### 6. Seed Demo Data (Optional)

```bash
npm run db:seed
```

This creates:

- Demo venue: `demo-venue` (email: demo@votebox.com, password: DemoVenue123!)
- Test event: "Doom Rock Night"

### 7. Start Development Servers

```bash
npm run dev
```

This starts:

- 🌐 **Web App**: http://localhost:3000
- 🔌 **API Server**: http://localhost:4000
- 📚 **API Docs**: http://localhost:4000/api/docs
- 🗄️ **Prisma Studio**: `npm run db:studio` (separate terminal)

---

## 📁 Project Structure

```
votebox/
├── apps/
│   ├── web/                  # Next.js PWA (Guest + Display)
│   │   ├── app/              # App Router pages
│   │   ├── components/       # React components
│   │   └── lib/              # Utilities, API client, Socket.io
│   ├── admin/                # Next.js Admin Dashboard (TODO)
│   └── api/                  # NestJS Backend API
│       ├── src/
│       │   ├── auth/         # Authentication module
│       │   ├── venues/       # Venue management
│       │   ├── events/       # Event CRUD
│       │   ├── votes/        # Voting logic
│       │   ├── queue/        # Queue management
│       │   ├── spotify/      # Spotify integration
│       │   └── websocket/    # Real-time gateway
│       └── test/             # E2E tests
├── packages/
│   ├── database/             # Prisma schema, migrations, seed
│   ├── types/                # Shared TypeScript types
│   ├── config/               # Shared configs (TS, ESLint)
│   └── utils/                # Shared utilities (TODO)
├── docker/                   # Production Dockerfiles
├── .github/workflows/        # CI/CD pipelines
└── docs/                     # Comprehensive documentation
```

---

## 📚 Documentation

### Getting Started

- [Setup Guide](./SETUP.md) - Quick setup instructions
- [Getting Started](./GETTING_STARTED.md) - 5-minute quickstart
- [Development Setup](./DEVELOPMENT_SETUP.md) - Detailed development guide

### Architecture & Design

- [Architecture](./ARCHITECTURE.md) - System architecture, data flow
- [Tech Stack](./TECH_STACK.md) - Technology choices and ADRs
- [Database Schema](./DATABASE_SCHEMA.md) - Complete data model
- [API Design](./API_DESIGN.md) - REST endpoints, WebSocket events

### API & Testing

- [API Documentation](./docs/API.md) - Complete API reference
- [Testing Guide](./docs/TESTING.md) - Testing strategy and guides

### Project Management

- [Project Plan](./PROJECT_PLAN.md) - 12-week development timeline
- [Documentation Index](./DOCUMENTATION_INDEX.md) - All documentation
- [Claude Instructions](./CLAUDE.md) - AI assistant context

---

## 🗓️ Development Roadmap

### ✅ Week 1: Foundation - **COMPLETE**

- [x] Monorepo structure with Turborepo
- [x] Next.js PWA setup
- [x] NestJS API setup
- [x] PostgreSQL + Prisma schema
- [x] Redis configuration
- [x] Docker Compose environment
- [x] CI/CD with GitHub Actions
- [x] Health check endpoints

### ✅ Week 2: Core Backend - **COMPLETE**

- [x] Venue management API
- [x] Event CRUD operations with lifecycle management
- [x] Spotify OAuth integration
- [x] Queue management system with intelligent scoring

### ✅ Week 3: Guest Interface - **COMPLETE**

- [x] Guest PWA voting interface
- [x] Track browsing and search with Spotify integration
- [x] Voting mechanism with session tracking
- [x] Real-time WebSocket updates (queue, now playing, events)
- [x] Display screen for venues

### ✅ Week 4: Queue Algorithm & MVP - **COMPLETE**

- [x] Weighted voting algorithm (vote count, recency, diversity, penalties)
- [x] Anti-spam measures (4-layer system)
- [x] Admin controls (clear queue, skip track, remove track, recalculate scores)
- [x] Playback automation with Spotify Web Playback SDK
- [x] End-to-End testing with Playwright (31 test cases)
- [x] Comprehensive unit tests (34+ test cases)
- [x] **WEEK 4 MVP FULLY COMPLETE** 🎉

### ⏳ Week 5-8: Admin Dashboard Enhancement

- [ ] Admin authentication & authorization
- [ ] Real-time analytics dashboard
- [ ] Event monitoring and controls
- [ ] Venue management interface

See [PROJECT_PLAN.md](./PROJECT_PLAN.md) for the complete 12-week roadmap.

---

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:ci

# Run E2E tests
npm run test:e2e
```

---

## 🔧 Development Commands

```bash
# Development
npm run dev              # Start all apps in development mode
npm run build            # Build all apps
npm run lint             # Lint all code
npm run format           # Format all code with Prettier

# Database
npm run db:migrate       # Run Prisma migrations
npm run db:studio        # Open Prisma Studio GUI
npm run db:seed          # Seed demo data

# Docker
docker-compose up        # Start all services
docker-compose up -d     # Start in detached mode
docker-compose down      # Stop all services
docker-compose logs -f   # View logs
```

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### 1. Fork & Clone

```bash
git clone https://github.com/YOUR_USERNAME/Votebox.git
cd Votebox
```

### 2. Create a Branch

```bash
git checkout -b feature/your-feature-name
```

### 3. Make Changes

- Follow the code style (ESLint + Prettier)
- Write tests for new features
- Update documentation as needed

### 4. Commit

```bash
git commit -m "feat: add amazing feature"
```

Use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Build process or auxiliary tool changes

### 5. Push & Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

### Code Review Process

1. Automated CI checks must pass
2. At least one maintainer review required
3. All discussions must be resolved
4. Branch must be up-to-date with main

---

## 📊 Project Status & Metrics

### Current Status: Week 1-4 MVP Complete ✅

**MVP Achievements:**

- ✅ Complete backend API with NestJS (Venue, Event, Queue, Spotify, Playback)
- ✅ Guest voting PWA with Next.js (voting, real-time updates, display screen)
- ✅ Intelligent queue algorithm (weighted scoring with 4 factors)
- ✅ 4-layer anti-spam system (cooldowns, rate limits, IP tracking)
- ✅ Real-time WebSocket updates (Socket.io)
- ✅ Admin queue controls (clear, skip, remove, recalculate)
- ✅ Playback automation (auto-play, track transitions, Spotify integration)
- ✅ Comprehensive testing (34+ unit tests, 31 E2E tests)
- ✅ Complete API documentation
- ✅ CI/CD pipeline with GitHub Actions (unit + E2E)

**Code Metrics:**

- **Backend**: 8 modules (Playback added), 2,000+ lines of core logic
- **Frontend**: 7+ React components, Zustand state management
- **Tests**: 34+ unit tests + 31 E2E tests with Playwright
- **Database**: 5 tables with proper relations
- **Documentation**: 10+ comprehensive docs including API and testing guides

**Next Steps:**

- [ ] Production deployment setup
- [ ] Admin authentication & dashboard
- [ ] Real-time analytics dashboard
- [ ] Subscription management system

### GitHub Stats

- **Issues Closed**: Week 1-4 fully complete (all MVP milestones)
- **Pull Requests**: Open PRs welcome
- **Contributors**: 1 (join us!)
- **CI Status**: ✅ All checks passing (unit + E2E tests)

---

## 🐛 Troubleshooting

### Port Conflicts

If ports are already in use:

```bash
# Find processes using ports
lsof -i :3000   # Web
lsof -i :4000   # API
lsof -i :5432   # PostgreSQL
lsof -i :6379   # Redis

# Or change ports in .env file
```

### Database Issues

```bash
# Reset database completely
docker-compose down -v
docker-compose up -d postgres
npm run db:migrate
npm run db:seed
```

### Node Module Issues

```bash
# Clean reinstall
rm -rf node_modules package-lock.json
npm install
```

### Prisma Issues

```bash
# Regenerate Prisma Client
npx prisma generate --schema=packages/database/prisma/schema.prisma
```

See [DEVELOPMENT_SETUP.md](./DEVELOPMENT_SETUP.md) for more troubleshooting.

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Spotify** for their excellent Web API and Web Playback SDK
- **NestJS** and **Next.js** communities for amazing frameworks
- **Prisma** team for the best TypeScript ORM
- The **open-source community** for countless tools and libraries
- All the **venues and music lovers** who inspired this project

---

## 📧 Contact & Support

- **Project Lead**: Olaf Kfreund
- **GitHub**: [@olafkfreund](https://github.com/olafkfreund)
- **Issues**: [GitHub Issues](https://github.com/olafkfreund/Votebox/issues)
- **Discussions**: [GitHub Discussions](https://github.com/olafkfreund/Votebox/discussions)

---

## 🌟 Show Your Support

If you find this project interesting, please:

- ⭐ Star the repository
- 🐛 Report bugs via [Issues](https://github.com/olafkfreund/Votebox/issues)
- 💡 Suggest features via [Discussions](https://github.com/olafkfreund/Votebox/discussions)
- 🔀 Submit Pull Requests
- 📢 Share with others

---

<div align="center">

**Built with ❤️ by developers who love live music**

[Documentation](./DOCUMENTATION_INDEX.md) • [Architecture](./ARCHITECTURE.md) • [Contributing](#-contributing) • [License](./LICENSE)

</div>
