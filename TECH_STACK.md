# Votebox Technology Stack

## 🎯 Stack Overview

Votebox uses a modern, cloud-native stack optimized for real-time performance, scalability, and developer productivity.

## Core Principles

1. **TypeScript Everywhere**: Type safety across frontend and backend
2. **API-First**: RESTful + WebSocket hybrid architecture
3. **Real-time by Default**: Live updates without polling
4. **Cloud Native**: Container-ready, horizontally scalable
5. **Developer Experience**: Fast iteration, excellent tooling

## 🏗️ Architecture Decision Records (ADRs)

### ADR-001: Monorepo Structure

**Decision**: Use Turborepo for monorepo management

**Rationale**:

- Share code between frontend and backend
- Consistent tooling and configurations
- Faster builds with intelligent caching
- Better developer experience

**Alternatives Considered**:

- Nx: More complex, overkill for initial scope
- Separate repos: Code duplication, harder to maintain types
- Lerna: Less active development

**Implementation**:

```json
{
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test"
  }
}
```

### ADR-002: Next.js for Frontend

**Decision**: Use Next.js 14 (App Router) for all frontend applications

**Rationale**:

- SSR/SSG for better SEO and performance
- Built-in API routes (for admin dashboard)
- Excellent PWA support
- React Server Components for better performance
- Great DX with Fast Refresh

**Configuration**:

```javascript
// next.config.js
module.exports = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    serverActions: true,
  },
  // PWA configuration
  pwa: {
    dest: 'public',
    register: true,
    skipWaiting: true,
    runtimeCaching: [
      /* ... */
    ],
  },
};
```

### ADR-003: NestJS for Backend

**Decision**: Use NestJS as the backend framework

**Rationale**:

- Built-in TypeScript support
- Excellent architecture (modules, dependency injection)
- WebSocket support with Socket.io integration
- Great for microservices (future scaling)
- Large ecosystem of libraries
- Your familiarity with enterprise patterns

**Alternatives Considered**:

- Express: Too low-level, less structure
- Fastify: Faster but less ecosystem
- tRPC: Couples frontend/backend too tightly

**Project Structure**:

```
apps/api/
├── src/
│   ├── auth/                 # Authentication module
│   ├── venues/               # Venue management
│   ├── events/               # Event management
│   ├── votes/                # Voting logic
│   ├── queue/                # Queue management
│   ├── spotify/              # Spotify integration
│   ├── websocket/            # Real-time gateway
│   ├── common/               # Shared utilities
│   │   ├── guards/
│   │   ├── decorators/
│   │   ├── filters/
│   │   └── interceptors/
│   └── main.ts
├── test/
└── prisma/
```

### ADR-004: PostgreSQL with Prisma

**Decision**: Use PostgreSQL as primary database with Prisma ORM

**Rationale**:

- Relational data model fits use case
- ACID compliance for vote integrity
- Excellent JSON support for flexible configs
- Prisma provides type-safe database access
- Great migration system
- Your PostgreSQL expertise

**Schema Example**:

```prisma
model Venue {
  id               String   @id @default(cuid())
  name             String
  slug             String   @unique
  spotifyAccountId String?
  settings         Json     @default("{}")
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  events           Event[]
  subscriptions    Subscription[]
}

model Event {
  id              String   @id @default(cuid())
  venueId         String
  name            String
  scheduledDate   DateTime
  startTime       DateTime
  endTime         DateTime
  status          EventStatus @default(UPCOMING)
  playlistConfig  Json

  venue           Venue    @relation(fields: [venueId], references: [id])
  votes           Vote[]
  queue           QueueItem[]

  @@index([venueId, status])
  @@index([scheduledDate])
}
```

### ADR-005: Redis for Caching and Sessions

**Decision**: Use Redis for caching, sessions, and queue management

**Rationale**:

- Sub-millisecond latency
- Perfect for real-time queue state
- Session management
- Rate limiting
- Pub/sub for distributed systems (future)

**Use Cases**:

```typescript
// Track cache (reduce Spotify API calls)
await redis.setex(
  `tracks:event:${eventId}`,
  86400, // 24 hours
  JSON.stringify(tracks)
);

// Vote rate limiting
const key = `votes:user:${userId}`;
const count = await redis.incr(key);
if (count === 1) {
  await redis.expire(key, 3600); // 1 hour window
}
if (count > 3) {
  throw new TooManyRequestsException();
}

// Queue state
await redis.zadd(`queue:event:${eventId}`, score, trackId);
```

### ADR-006: Socket.io for Real-time

**Decision**: Use Socket.io for WebSocket communication

**Rationale**:

- Automatic fallback to polling
- Built-in reconnection logic
- Room-based broadcasting
- Excellent NestJS integration
- Battle-tested in production

**Implementation**:

```typescript
@WebSocketGateway({ cors: true })
export class EventsGateway {
  @SubscribeMessage('joinEvent')
  handleJoinEvent(@MessageBody() data: { eventId: string }, @ConnectedSocket() client: Socket) {
    client.join(`event:${data.eventId}`);
  }

  // Broadcast vote update to all clients in event
  broadcastVoteUpdate(eventId: string, update: VoteUpdate) {
    this.server.to(`event:${eventId}`).emit('voteUpdate', update);
  }
}
```

### ADR-007: Spotify Web API

**Decision**: Use Spotify Web API + Web Playback SDK

**Rationale**:

- Industry-standard music platform
- Comprehensive API
- Web Playback SDK for browser-based playback
- Large music catalog
- Venue owners likely already have Spotify

**Integration Strategy**:

```typescript
class SpotifyService {
  // OAuth 2.0 flow for venue authentication
  async authenticateVenue(code: string) {
    const tokens = await this.spotifyAuth.getTokens(code);
    // Store refresh token for venue
  }

  // Search by genre
  async searchByGenre(genres: string[], limit: number) {
    return this.spotify.getRecommendations({
      seed_genres: genres,
      limit,
    });
  }

  // Control playback
  async playTrack(trackUri: string, deviceId: string) {
    return this.spotify.play({
      uris: [trackUri],
      device_id: deviceId,
    });
  }
}
```

**Rate Limiting**:

- 180 requests per minute per user
- Implement exponential backoff
- Cache aggressively

## 📦 Technology Choices

### Frontend Stack

#### Next.js 14.x

```bash
npm install next@latest react@latest react-dom@latest
```

**Features Used**:

- App Router (server components)
- Server Actions (form mutations)
- Route Handlers (API routes)
- Middleware (auth, redirects)
- Image optimization

#### Tailwind CSS 3.x

```bash
npm install -D tailwindcss postcss autoprefixer
```

**Configuration**:

```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {...},
        secondary: {...}
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography')
  ]
}
```

#### PWA Support

```bash
npm install next-pwa
```

**Features**:

- Install prompt
- Offline support
- Push notifications (future)
- Add to homescreen

#### UI Components

```bash
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install class-variance-authority clsx tailwind-merge
```

**Component Library**:

- Radix UI (headless components)
- Custom styled with Tailwind
- Accessible by default

#### State Management

```bash
npm install zustand
```

**Why Zustand**:

- Simple API
- No boilerplate
- TypeScript-first
- Perfect for small state needs

```typescript
// stores/event-store.ts
export const useEventStore = create<EventStore>((set) => ({
  currentEvent: null,
  queue: [],
  nowPlaying: null,
  setCurrentEvent: (event) => set({ currentEvent: event }),
  updateQueue: (queue) => set({ queue }),
}));
```

#### Form Handling

```bash
npm install react-hook-form zod @hookform/resolvers
```

**Why React Hook Form + Zod**:

- Performance (uncontrolled components)
- Type-safe validation
- Great DX

```typescript
const schema = z.object({
  eventName: z.string().min(3).max(100),
  startTime: z.date(),
  playlistConfig: z.object({
    type: z.enum(['genre', 'playlist', 'custom']),
    genres: z.array(z.string()).optional(),
  }),
});

const form = useForm<z.infer<typeof schema>>({
  resolver: zodResolver(schema),
});
```

### Backend Stack

#### NestJS 10.x

```bash
npm install @nestjs/core @nestjs/common @nestjs/platform-express
npm install @nestjs/websockets @nestjs/platform-socket.io
npm install @nestjs/config @nestjs/jwt @nestjs/passport
```

**Key Modules**:

- Core framework
- WebSocket support
- Configuration management
- Authentication

#### Database & ORM

```bash
npm install @prisma/client
npm install -D prisma
```

**Prisma Features**:

- Type-safe queries
- Migration system
- Seeding support
- Studio (GUI)

#### Authentication

```bash
npm install passport passport-jwt bcrypt
npm install -D @types/passport-jwt @types/bcrypt
```

**Strategy**:

- JWT tokens for API auth
- HTTP-only cookies for web
- Refresh token rotation

#### Validation

```bash
npm install class-validator class-transformer
```

**DTOs**:

```typescript
export class CreateEventDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @IsDate()
  @Type(() => Date)
  startTime: Date;

  @ValidateNested()
  @Type(() => PlaylistConfigDto)
  playlistConfig: PlaylistConfigDto;
}
```

#### HTTP Client

```bash
npm install axios
```

**Spotify API Wrapper**:

```typescript
@Injectable()
export class SpotifyHttpService {
  private axios: AxiosInstance;

  constructor() {
    this.axios = axios.create({
      baseURL: 'https://api.spotify.com/v1',
      timeout: 5000,
    });

    // Request interceptor for auth
    this.axios.interceptors.request.use(/*...*/);

    // Response interceptor for retry
    this.axios.interceptors.response.use(/*...*/);
  }
}
```

### Infrastructure

#### Containerization

```bash
# Development
docker-compose up -d

# Production
docker build -t votebox-api:latest .
docker build -t votebox-web:latest .
```

**docker-compose.yml**:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: votebox
      POSTGRES_USER: votebox
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - '5432:5432'

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    ports:
      - '6379:6379'

  api:
    build:
      context: .
      dockerfile: docker/Dockerfile.api
    environment:
      DATABASE_URL: postgresql://votebox:${DB_PASSWORD}@postgres:5432/votebox
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
    depends_on:
      - postgres
      - redis
    ports:
      - '4000:4000'

  web:
    build:
      context: .
      dockerfile: docker/Dockerfile.web
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:4000
    ports:
      - '3000:3000'

volumes:
  postgres_data:
  redis_data:
```

#### CI/CD - GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci

      - run: npm run lint

      - run: npm run test:ci

      - run: npm run build

      - uses: codecov/codecov-action@v3
```

#### Infrastructure as Code (Optional)

**Terraform for Cloud Resources**:

```hcl
# terraform/main.tf
provider "aws" {
  region = "eu-west-2" # London
}

resource "aws_db_instance" "votebox" {
  identifier        = "votebox-prod"
  engine            = "postgres"
  engine_version    = "16"
  instance_class    = "db.t4g.micro"
  allocated_storage = 20

  db_name  = "votebox"
  username = var.db_username
  password = var.db_password

  skip_final_snapshot = false
  final_snapshot_identifier = "votebox-final-snapshot"
}

resource "aws_elasticache_cluster" "votebox" {
  cluster_id           = "votebox-redis"
  engine               = "redis"
  node_type            = "cache.t4g.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
}
```

### Monitoring & Observability

#### Logging

```bash
npm install winston
```

```typescript
// logger.service.ts
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});
```

#### Metrics (Future)

- Prometheus for metrics collection
- Grafana for visualization
- Custom dashboards for business metrics

#### Error Tracking

```bash
npm install @sentry/nextjs @sentry/node
```

**Sentry Integration**:

- Frontend errors with replay
- Backend errors with context
- Performance monitoring

### Testing Stack

#### Unit Testing

```bash
npm install -D jest @types/jest ts-jest
npm install -D @testing-library/react @testing-library/jest-dom
```

**Configuration**:

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

#### E2E Testing

```bash
npm install -D @playwright/test
```

**Test Example**:

```typescript
test('guest can vote for a track', async ({ page }) => {
  await page.goto('/v/demo-venue/event/123');
  await page.click('[data-testid="track-vote-button-1"]');
  await expect(page.locator('[data-testid="vote-success"]')).toBeVisible();
});
```

## 📊 Performance Targets

| Metric                       | Target | Measurement      |
| ---------------------------- | ------ | ---------------- |
| Time to First Byte (TTFB)    | <200ms | Lighthouse       |
| First Contentful Paint (FCP) | <1.5s  | Lighthouse       |
| API Response Time (p95)      | <500ms | Prometheus       |
| WebSocket Latency            | <100ms | Custom metrics   |
| Database Query Time (p95)    | <50ms  | Prisma logging   |
| Vote Processing Time         | <200ms | Application logs |

## 🔧 Development Tools

```bash
# Code Quality
npm install -D eslint @typescript-eslint/eslint-plugin
npm install -D prettier eslint-config-prettier
npm install -D husky lint-staged

# Git Hooks
npx husky-init
echo "npx lint-staged" > .husky/pre-commit

# Commit Standards
npm install -D @commitlint/cli @commitlint/config-conventional
```

## 🚀 Deployment Strategy

### Option 1: Single VPS (Recommended for MVP)

- **Provider**: Hetzner/DigitalOcean
- **Spec**: 4GB RAM, 2 vCPU, 80GB SSD
- **Cost**: £20-30/month
- **Deployment**: Docker Compose + Nginx
- **SSL**: Let's Encrypt via Certbot

### Option 2: Cloud Platform (Future Scale)

- **Provider**: AWS/Azure/GCP
- **Services**:
  - Managed Kubernetes (EKS/AKS/GKE)
  - Managed Postgres (RDS/Azure DB)
  - Managed Redis (ElastiCache/Azure Cache)
- **Cost**: £200-500/month
- **Benefits**: Auto-scaling, managed services

### Option 3: Serverless (Alternative)

- **Frontend**: Vercel/Netlify
- **Backend**: AWS Lambda + API Gateway
- **Database**: Aurora Serverless
- **Cost**: Pay-per-use, £50-200/month

## 📚 Learning Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [Next.js Learn](https://nextjs.org/learn)
- [Spotify Web API Reference](https://developer.spotify.com/documentation/web-api)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Socket.io Documentation](https://socket.io/docs)

---

**Last Updated**: January 2026  
**Maintained By**: Olaf Kfreund
