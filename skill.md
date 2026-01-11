# Votebox Development Skill

This skill provides context and best practices for developing Votebox, a cloud-native SaaS platform for democratic music voting in venues.

## Project Overview

Votebox enables pub and club guests to vote on music from their phones. Venues create themed events (e.g., "Doom Rock Night", "Black Metal Evening") and guests vote on tracks from curated playlists or genres.

**Tech Stack**: Next.js 14, NestJS, TypeScript, PostgreSQL, Redis, Socket.io, Spotify API

**Developer**: Experienced Cloud Architect & DevOps Leader with expertise in Terraform, Kubernetes, and enterprise CI/CD pipelines.

## Project Structure

```
votebox/
├── apps/
│   ├── web/              # Next.js PWA (Guest voting interface + Display screen)
│   ├── admin/            # Next.js Admin Dashboard for venue management
│   └── api/              # NestJS Backend API with WebSocket support
├── packages/
│   ├── ui/               # Shared React components with Tailwind CSS
│   ├── database/         # Prisma schema, migrations, and seed data
│   ├── types/            # Shared TypeScript types and interfaces
│   ├── config/           # Shared ESLint, Prettier, TypeScript configs
│   └── utils/            # Shared utility functions
├── docker/               # Dockerfiles for containerization
│   ├── Dockerfile.api
│   ├── Dockerfile.web
│   └── docker-compose.yml
├── .github/
│   └── workflows/        # CI/CD with GitHub Actions
│       ├── ci.yml        # Test and build pipeline
│       └── deploy.yml    # Deployment pipeline
└── terraform/            # Infrastructure as Code (optional for cloud deployment)
```

## Core Concepts

### Event-Based Architecture
- **Venues** create **Events** (themed music sessions)
- **Events** have playlist configurations (genre, Spotify playlist, or custom)
- **Guests** vote on tracks without requiring accounts
- **Queue** is dynamically reordered based on votes

### Real-time Updates
- WebSocket connections for live queue updates
- Vote updates broadcast to all connected clients
- Now playing status synced across all devices

### Multi-Tenancy
- Each venue is a separate tenant
- Data isolation via `venueId` in all queries
- Subscription-based access control

## Development Guidelines

### TypeScript Conventions

```typescript
// ✅ Use explicit types for function parameters and return values
async function createVote(
  eventId: string,
  trackId: string,
  sessionId: string
): Promise<Vote> {
  // Implementation
}

// ✅ Use interfaces for complex objects
interface QueueItem {
  position: number;
  trackId: string;
  trackName: string;
  voteCount: number;
  score: number;
}

// ✅ Use type guards for runtime checks
function isVoteRateLimitError(error: unknown): error is VoteRateLimitError {
  return error instanceof VoteRateLimitError;
}

// ❌ Avoid 'any' - use 'unknown' and narrow with type guards
```

### NestJS Patterns

```typescript
// ✅ Use proper dependency injection
@Injectable()
export class EventService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly spotify: SpotifyService,
    private readonly cache: CacheService
  ) {}
}

// ✅ Use DTOs with validation decorators
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

// ✅ Use guards for authorization
@UseGuards(JwtAuthGuard, VenueOwnerGuard)
@Post(':venueId/events')
async createEvent(
  @Param('venueId') venueId: string,
  @Body() dto: CreateEventDto
) {
  return this.eventService.create(venueId, dto);
}

// ✅ Use interceptors for cross-cutting concerns
@UseInterceptors(CacheInterceptor)
@Get(':id')
async findOne(@Param('id') id: string) {
  return this.eventService.findOne(id);
}
```

### Prisma Best Practices

```typescript
// ✅ Use transactions for related operations
await prisma.$transaction(async (tx) => {
  const vote = await tx.vote.create({
    data: { eventId, trackId, sessionId }
  });

  await tx.queueItem.upsert({
    where: { eventId_trackId: { eventId, trackId } },
    update: { voteCount: { increment: 1 } },
    create: { eventId, trackId, voteCount: 1 }
  });

  return vote;
});

// ✅ Use select to reduce data transfer
const events = await prisma.event.findMany({
  where: { venueId, status: 'ACTIVE' },
  select: {
    id: true,
    name: true,
    startTime: true,
    venue: { select: { name: true, slug: true } }
  }
});

// ✅ Use proper indexes (defined in schema.prisma)
@@index([venueId, status])
@@index([eventId, votedAt])
@@unique([eventId, trackId])
```

### Next.js App Router Patterns

```typescript
// ✅ Use Server Components by default for data fetching
// app/events/[id]/page.tsx
export default async function EventPage({ params }: { params: { id: string } }) {
  const event = await getEvent(params.id);
  return <EventDetails event={event} />;
}

// ✅ Use Client Components for interactivity
// components/VoteButton.tsx
'use client';
export function VoteButton({ trackId }: { trackId: string }) {
  const [isVoting, setIsVoting] = useState(false);
  
  const handleVote = async () => {
    setIsVoting(true);
    await submitVote(trackId);
    setIsVoting(false);
  };

  return (
    <button onClick={handleVote} disabled={isVoting}>
      {isVoting ? 'Voting...' : 'Vote'}
    </button>
  );
}

// ✅ Use Server Actions for mutations
// app/actions.ts
'use server';
export async function submitVote(trackId: string) {
  const session = await getServerSession();
  // Validate, call API, revalidate
  revalidatePath('/events/[id]');
}

// ✅ Use middleware for auth and redirects
// middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token');
  if (!token && request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}
```

### WebSocket Patterns

```typescript
// ✅ Use rooms for scoped broadcasting
@WebSocketGateway({ cors: true })
export class EventsGateway {
  @SubscribeMessage('joinEvent')
  handleJoinEvent(
    @MessageBody() data: { eventId: string },
    @ConnectedSocket() client: Socket
  ) {
    client.join(`event:${data.eventId}`);
    client.emit('joined', { eventId: data.eventId });
  }

  // ✅ Broadcast to specific room
  broadcastVoteUpdate(eventId: string, update: VoteUpdate) {
    this.server
      .to(`event:${eventId}`)
      .emit('voteUpdate', update);
  }

  // ✅ Handle disconnections
  @SubscribeMessage('disconnect')
  handleDisconnect(@ConnectedSocket() client: Socket) {
    // Cleanup
  }
}
```

### Queue Algorithm

```typescript
// ✅ Calculate queue score with multiple factors
function calculateQueueScore(item: QueueItem): number {
  const baseScore = item.voteCount;
  
  // Recency bonus (votes in last 5 minutes)
  const timeSinceLastVote = Date.now() - item.lastVotedAt.getTime();
  const recencyBonus = timeSinceLastVote < 300000 ? 2 : 0;
  
  // Diversity bonus (different artist than current track)
  const diversityBonus = item.artistName !== currentTrack.artistName ? 1 : 0;
  
  return baseScore + recencyBonus + diversityBonus;
}

// ✅ Reorder queue based on scores
async function reorderQueue(eventId: string) {
  const items = await prisma.queueItem.findMany({
    where: { eventId, isPlayed: false },
    orderBy: { score: 'desc' }
  });

  // Update positions in transaction
  await prisma.$transaction(
    items.map((item, index) =>
      prisma.queueItem.update({
        where: { id: item.id },
        data: { position: index + 1 }
      })
    )
  );
}
```

### Spotify Integration

```typescript
// ✅ Handle OAuth flow
async authenticateVenue(code: string, venueId: string) {
  const tokens = await this.spotifyAuth.getTokens(code);
  
  await this.prisma.venue.update({
    where: { id: venueId },
    data: {
      spotifyAccessToken: tokens.access_token,
      spotifyRefreshToken: tokens.refresh_token,
      spotifyTokenExpiry: new Date(Date.now() + tokens.expires_in * 1000)
    }
  });
}

// ✅ Refresh tokens when expired
async getValidAccessToken(venueId: string): Promise<string> {
  const venue = await this.prisma.venue.findUnique({
    where: { id: venueId },
    select: {
      spotifyAccessToken: true,
      spotifyRefreshToken: true,
      spotifyTokenExpiry: true
    }
  });

  if (venue.spotifyTokenExpiry > new Date()) {
    return venue.spotifyAccessToken;
  }

  // Refresh token
  const newTokens = await this.spotifyAuth.refreshToken(
    venue.spotifyRefreshToken
  );

  await this.prisma.venue.update({
    where: { id: venueId },
    data: {
      spotifyAccessToken: newTokens.access_token,
      spotifyTokenExpiry: new Date(Date.now() + newTokens.expires_in * 1000)
    }
  });

  return newTokens.access_token;
}

// ✅ Implement rate limiting and retry logic
async searchTracks(query: string, limit: number) {
  return retry(
    async () => {
      const response = await this.spotify.search({
        q: query,
        type: 'track',
        limit
      });
      return response.tracks.items;
    },
    {
      retries: 3,
      backoff: 'exponential',
      onRetry: (error, attempt) => {
        this.logger.warn(`Spotify API retry ${attempt}:`, error);
      }
    }
  );
}
```

### Caching Strategies

```typescript
// ✅ Cache track lists for events
async getEventTracks(eventId: string): Promise<Track[]> {
  const cacheKey = `tracks:event:${eventId}`;
  
  // Try cache first
  const cached = await this.redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // Load from Spotify
  const tracks = await this.loadTracksFromSpotify(eventId);
  
  // Cache for 1 hour
  await this.redis.setex(cacheKey, 3600, JSON.stringify(tracks));
  
  return tracks;
}

// ✅ Cache Spotify API responses
async getRecommendations(seedGenres: string[]): Promise<Track[]> {
  const cacheKey = `spotify:recommendations:${seedGenres.join(',')}`;
  
  const cached = await this.redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const recommendations = await this.spotify.getRecommendations({
    seed_genres: seedGenres,
    limit: 100
  });

  // Cache for 24 hours
  await this.redis.setex(cacheKey, 86400, JSON.stringify(recommendations));
  
  return recommendations;
}
```

### Rate Limiting

```typescript
// ✅ Implement vote rate limiting
async checkVoteRateLimit(sessionId: string): Promise<void> {
  const key = `votes:ratelimit:${sessionId}`;
  
  const count = await this.redis.incr(key);
  
  if (count === 1) {
    // First vote in window, set expiry (1 hour)
    await this.redis.expire(key, 3600);
  }
  
  if (count > 3) {
    const ttl = await this.redis.ttl(key);
    throw new VoteRateLimitError(`Try again in ${ttl} seconds`);
  }
}

// ✅ Implement global API rate limiting
@UseGuards(ThrottlerGuard)
@Throttle(100, 60) // 100 requests per minute
@Get()
async findAll() {
  // Implementation
}
```

### Error Handling

```typescript
// ✅ Create custom error classes
export class VoteRateLimitError extends Error {
  constructor(message: string, public retryAfter: number) {
    super(message);
    this.name = 'VoteRateLimitError';
  }
}

// ✅ Use exception filters
@Catch(VoteRateLimitError)
export class VoteRateLimitFilter implements ExceptionFilter {
  catch(exception: VoteRateLimitError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    response.status(429).json({
      error: 'RATE_LIMIT_EXCEEDED',
      message: exception.message,
      retryAfter: exception.retryAfter
    });
  }
}
```

### Testing

```typescript
// ✅ Unit test with proper mocking
describe('VoteService', () => {
  let service: VoteService;
  let prisma: PrismaService;
  let redis: RedisService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        VoteService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisService, useValue: mockRedisService }
      ]
    }).compile();

    service = module.get(VoteService);
    prisma = module.get(PrismaService);
    redis = module.get(RedisService);
  });

  it('should create a vote', async () => {
    const vote = await service.create({
      eventId: 'event1',
      trackId: 'track1',
      sessionId: 'session1'
    });

    expect(vote).toBeDefined();
    expect(prisma.vote.create).toHaveBeenCalled();
  });

  it('should throw rate limit error', async () => {
    redis.incr = jest.fn().resolvedValue(4); // Exceed limit

    await expect(
      service.create({
        eventId: 'event1',
        trackId: 'track1',
        sessionId: 'session1'
      })
    ).rejects.toThrow(VoteRateLimitError);
  });
});
```

## Common Tasks

### Adding a New API Endpoint

1. Create DTO in `apps/api/src/[module]/dto/`
2. Add method to service in `apps/api/src/[module]/[module].service.ts`
3. Add controller method in `apps/api/src/[module]/[module].controller.ts`
4. Add tests in `apps/api/src/[module]/[module].service.spec.ts`
5. Update API documentation in `API_DESIGN.md`

### Adding a New UI Component

1. Create component in `packages/ui/src/components/`
2. Export from `packages/ui/src/index.ts`
3. Add Storybook story if needed
4. Use in Next.js apps

### Database Schema Changes

1. Update `packages/database/prisma/schema.prisma`
2. Run `npx prisma migrate dev --name [migration-name]`
3. Update TypeScript types if needed
4. Update seed data if needed
5. Update `DATABASE_SCHEMA.md` documentation

### Adding Real-time Events

1. Add event handler in `apps/api/src/websocket/events.gateway.ts`
2. Add client listener in Next.js components
3. Test with multiple clients
4. Update `API_DESIGN.md` with new events

## Performance Considerations

- **Database**: Use indexes, limit queries, select only needed fields
- **Cache**: Cache Spotify responses, track lists, queue state
- **WebSocket**: Throttle broadcasts, use rooms, disconnect inactive clients
- **API**: Implement rate limiting, pagination, query optimization

## Security Checklist

- ✅ Validate all input with DTOs
- ✅ Sanitize user input
- ✅ Use parameterized queries (Prisma handles this)
- ✅ Implement rate limiting
- ✅ Use HTTPS in production
- ✅ Store secrets in environment variables
- ✅ Implement CORS properly
- ✅ Use secure session cookies
- ✅ Validate JWT tokens
- ✅ Implement audit logging

## Key Files Reference

- `CLAUDE.md` - Full project context and guidelines
- `PROJECT_PLAN.md` - Development timeline and phases
- `TECH_STACK.md` - Technology choices and rationale
- `DATABASE_SCHEMA.md` - Complete database design
- `API_DESIGN.md` - API specifications

## Developer Notes

- **Experience Level**: Senior developer with extensive DevOps background
- **Strengths**: Infrastructure, Kubernetes, Terraform, CI/CD
- **Preferences**: Type safety, clean architecture, comprehensive testing
- **Tools**: NixOS, COSMIC Desktop, Obsidian for documentation

---

This skill should help you maintain consistency and best practices throughout the Votebox project development.
