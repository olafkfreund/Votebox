# Claude Instructions for Votebox Project

## 🎯 Project Context

You are helping build **Votebox**, a cloud-native SaaS platform that enables pub and club guests to democratically vote on music from their phones. Venues create themed events (e.g., "Doom Rock Night") and guests vote on tracks from curated playlists or genres.

## 👤 Developer Profile

**Developer**: Olaf Kfreund

- **Role**: Cloud Architect & DevOps Leader
- **Experience**: 28+ years
- **Expertise**:
  - Infrastructure as Code (Terraform, Crossplane, Bicep)
  - Kubernetes, Docker, containerization
  - CI/CD (GitHub Actions, Azure DevOps, Jenkins)
  - Cloud platforms (AWS, Azure, GCP)
  - NixOS enthusiast running COSMIC Desktop Environment

## 🏗️ Tech Stack

### Frontend

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State**: Zustand
- **Real-time**: Socket.io client
- **PWA**: next-pwa

### Backend

- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis
- **Real-time**: Socket.io
- **Auth**: JWT with Passport

### Infrastructure

- **Containers**: Docker & Docker Compose
- **Orchestration**: Kubernetes (optional, developer is expert)
- **CI/CD**: GitHub Actions
- **Cloud**: AWS/Azure/GCP (developer's choice)
- **IaC**: Terraform (developer's specialty)

### External APIs

- **Spotify**: Web API + Web Playback SDK
- **Payments**: Stripe (future)

## 📁 Project Structure

```
votebox/
├── apps/
│   ├── web/              # Next.js PWA (Guest + Display)
│   ├── admin/            # Admin Dashboard (Next.js)
│   └── api/              # NestJS Backend
├── packages/
│   ├── ui/               # Shared components
│   ├── database/         # Prisma schema
│   ├── types/            # Shared TypeScript types
│   └── utils/            # Shared utilities
├── docker/               # Dockerfiles
├── .github/workflows/    # CI/CD pipelines
└── terraform/           # Infrastructure as Code
```

## 🎯 Current Phase

**Phase 1: MVP (Weeks 1-4)**

- Foundation & infrastructure setup
- Core backend services
- Guest voting interface
- Queue algorithm & testing

See `PROJECT_PLAN.md` for full timeline.

## 💡 Code Generation Guidelines

### 1. TypeScript Best Practices

```typescript
// ✅ DO: Use explicit types
interface VoteRequest {
  trackId: string;
  sessionId: string;
}

// ❌ DON'T: Use 'any'
function processVote(data: any) {}

// ✅ DO: Use proper error handling
try {
  await voteService.create(data);
} catch (error) {
  if (error instanceof VoteRateLimitError) {
    // Handle specific error
  }
  throw error;
}
```

### 2. NestJS Patterns

```typescript
// ✅ DO: Use proper dependency injection
@Injectable()
export class VoteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}
}

// ✅ DO: Use DTOs with validation
export class CreateVoteDto {
  @IsString()
  @IsNotEmpty()
  trackId: string;

  @IsString()
  @IsNotEmpty()
  sessionId: string;
}

// ✅ DO: Use guards for authorization
@UseGuards(JwtAuthGuard, VenueOwnerGuard)
@Post()
async create(@Body() dto: CreateVoteDto) { }
```

### 3. Next.js App Router Patterns

```typescript
// ✅ DO: Use Server Components by default
export default async function EventPage({ params }) {
  const event = await getEvent(params.eventId);
  return <EventDetails event={event} />;
}

// ✅ DO: Use Client Components when needed
'use client';
export function VoteButton({ trackId }) {
  const [isVoting, setIsVoting] = useState(false);
  // Interactive logic here
}

// ✅ DO: Use Server Actions for mutations
'use server';
export async function submitVote(formData: FormData) {
  const trackId = formData.get('trackId');
  // Mutation logic
}
```

### 4. Prisma Patterns

```typescript
// ✅ DO: Use transactions for related operations
await prisma.$transaction(async (tx) => {
  await tx.vote.create({ data: voteData });
  await tx.queueItem.update({
    where: { eventId_trackId: { eventId, trackId } },
    data: { voteCount: { increment: 1 } }
  });
});

// ✅ DO: Use proper indexes
@@index([venueId, status])
@@index([eventId, votedAt])

// ✅ DO: Use select to reduce data transfer
const event = await prisma.event.findUnique({
  where: { id },
  select: {
    id: true,
    name: true,
    status: true
  }
});
```

### 5. Real-time WebSocket Patterns

```typescript
// ✅ DO: Use rooms for scoped broadcasting
@SubscribeMessage('joinEvent')
handleJoinEvent(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
  client.join(`event:${data.eventId}`);
}

// ✅ DO: Broadcast efficiently
this.server
  .to(`event:${eventId}`)
  .emit('voteUpdate', update);
```

## 🧪 Testing Guidelines

### Unit Tests

```typescript
describe('VoteService', () => {
  let service: VoteService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VoteService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<VoteService>(VoteService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should create a vote', async () => {
    const vote = await service.create({
      eventId: 'event1',
      trackId: 'track1',
      sessionId: 'session1',
    });
    expect(vote).toBeDefined();
  });
});
```

### E2E Tests

```typescript
test('guest can vote for track', async ({ page }) => {
  await page.goto('/v/demo-venue/event/123');
  await page.click('[data-testid="track-vote-button"]');
  await expect(page.locator('.vote-success')).toBeVisible();
});
```

## 🔧 Development Workflow

### Starting Development

```bash
# 1. Start infrastructure
docker-compose up -d

# 2. Run migrations
npm run db:migrate

# 3. Seed database
npm run db:seed

# 4. Start dev servers
npm run dev
```

### Running Tests

```bash
npm run test          # Unit tests
npm run test:e2e      # E2E tests
npm run test:ci       # All tests with coverage
```

### Building

```bash
npm run build         # Build all apps
npm run build:api     # Build API only
npm run build:web     # Build web only
```

## 🐛 Debugging Tips

### Database Issues

```bash
# Reset database
npm run db:reset

# View database with Prisma Studio
npx prisma studio

# Check migrations
npx prisma migrate status
```

### API Issues

```bash
# Check logs
docker-compose logs -f api

# Test endpoint directly
curl -X POST http://localhost:4000/api/v1/events/:id/votes \
  -H "Content-Type: application/json" \
  -d '{"trackId": "...", "sessionId": "..."}'
```

### WebSocket Issues

```bash
# Check Socket.io connection
# In browser console:
socket.on('connect', () => console.log('Connected'));
socket.on('error', (err) => console.error('Error:', err));
```

## 📝 Documentation Standards

### Code Comments

```typescript
/**
 * Calculates queue position based on vote count and recency
 *
 * @param votes - Total votes for the track
 * @param lastVotedAt - When the track was last voted for
 * @returns Score used for queue ordering
 */
function calculateQueueScore(votes: number, lastVotedAt: Date): number {
  // Implementation
}
```

### API Documentation

Use JSDoc for all controllers:

```typescript
@ApiTags('votes')
@ApiOperation({ summary: 'Submit a vote for a track' })
@ApiResponse({ status: 201, description: 'Vote submitted successfully' })
@ApiResponse({ status: 429, description: 'Rate limit exceeded' })
@Post()
async create(@Body() dto: CreateVoteDto) { }
```

## 🔐 Security Considerations

### Always Validate Input

```typescript
// ✅ DO: Use DTOs with class-validator
export class CreateEventDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;
}
```

### Sanitize User Input

```typescript
// ✅ DO: Sanitize before storing
import { sanitize } from 'class-sanitizer';

@Post()
async create(@Body() dto: CreateEventDto) {
  sanitize(dto);
  // Process...
}
```

### Rate Limiting

```typescript
// ✅ DO: Implement rate limiting
@UseGuards(ThrottlerGuard)
@Throttle(3, 3600) // 3 votes per hour
@Post('votes')
async vote() { }
```

## 🚀 Deployment Considerations

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/votebox

# Redis
REDIS_URL=redis://localhost:6379

# Spotify
SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...

# JWT
JWT_SECRET=...
JWT_EXPIRES_IN=24h

# Environment
NODE_ENV=production
PORT=4000
```

### Docker Build

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
CMD ["node", "dist/main"]
```

### Kubernetes (Developer's Expertise)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: votebox-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: votebox-api
  template:
    metadata:
      labels:
        app: votebox-api
    spec:
      containers:
        - name: api
          image: votebox/api:latest
          ports:
            - containerPort: 4000
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: votebox-secrets
                  key: database-url
```

## 🎨 UI/UX Guidelines

### Tailwind Classes

```tsx
// ✅ DO: Use consistent spacing
<div className="p-4 sm:p-6 lg:p-8">

// ✅ DO: Use responsive design
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// ✅ DO: Use design tokens
<button className="bg-primary-600 hover:bg-primary-700">
```

### Loading States

```tsx
// ✅ DO: Show loading states
{
  isLoading ? <Spinner /> : <VoteButton />;
}
```

### Error States

```tsx
// ✅ DO: Show user-friendly errors
{
  error && <Alert type="error">{error.message || 'Something went wrong'}</Alert>;
}
```

## 📊 Performance Guidelines

### Database Queries

```typescript
// ✅ DO: Use indexes
@@index([eventId, status])

// ✅ DO: Limit results
take: 20

// ✅ DO: Select only needed fields
select: { id: true, name: true }
```

### Caching

```typescript
// ✅ DO: Cache expensive operations
const tracks = await redis.get(`tracks:event:${eventId}`);
if (!tracks) {
  tracks = await fetchFromSpotify();
  await redis.setex(`tracks:event:${eventId}`, 3600, tracks);
}
```

### WebSocket Optimization

```typescript
// ✅ DO: Throttle updates
_.throttle(() => {
  this.server.emit('queueUpdate', queue);
}, 1000);
```

## 🤝 Collaboration

### Commit Messages

```
feat: add vote cooldown mechanism
fix: correct queue position calculation
docs: update API documentation
refactor: extract queue scoring into service
test: add unit tests for vote service
```

### Pull Request Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## Checklist

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
```

## 🎯 Key Reminders

1. **Developer is highly experienced** - Can handle complex infrastructure and architectural discussions
2. **Focus on DevOps excellence** - CI/CD, containerization, IaC are areas of expertise
3. **Real-time is critical** - WebSocket performance and reliability are key
4. **Type safety** - Always use TypeScript properly, avoid `any`
5. **Testing** - Write tests for critical functionality
6. **Documentation** - Keep docs updated as code evolves
7. **Performance** - Consider scale from the start (caching, indexes, etc.)

## 📚 Reference Documents

- `PROJECT_PLAN.md` - Full development timeline and phases
- `TECH_STACK.md` - Detailed technology choices and rationale
- `DATABASE_SCHEMA.md` - Complete database design
- `API_DESIGN.md` - REST and WebSocket API specifications
- `ARCHITECTURE.md` - System architecture and design patterns

---

**Project**: Votebox  
**Developer**: Olaf Kfreund  
**Last Updated**: January 2026
