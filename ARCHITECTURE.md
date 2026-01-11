# Votebox Architecture

## 🎯 Architecture Overview

Votebox uses a modern, cloud-native architecture designed for real-time performance, scalability, and multi-tenancy.

## 📐 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Internet                                 │
└────────────────┬────────────────────────────────┬────────────────┘
                 │                                │
                 │                                │
        ┌────────▼────────┐              ┌───────▼────────┐
        │   CloudFlare    │              │   CloudFlare   │
        │      CDN        │              │   CDN + WAF    │
        └────────┬────────┘              └───────┬────────┘
                 │                                │
      ┌──────────▼───────────┐         ┌─────────▼──────────┐
      │    Next.js Web App    │         │   NestJS API       │
      │  (Guest + Display)    │         │  (REST + WS)       │
      │                       │         │                    │
      │  - PWA (mobile-first) │         │  - Event Service   │
      │  - Server Components  │         │  - Vote Service    │
      │  - Socket.io Client   │◄───────►│  - Queue Service   │
      │  - Real-time UI       │         │  - Spotify Service │
      └───────────────────────┘         │  - WebSocket GW    │
                                        └──────┬──────┬──────┘
      ┌───────────────────────┐                │      │
      │   Admin Dashboard     │                │      │
      │    (Next.js)          │                │      │
      │                       │                │      │
      │  - Event Management   │                │      │
      │  - Live Monitoring    │                │      │
      │  - Analytics          │◄───────────────┘      │
      │  - Settings           │                       │
      └───────────────────────┘                       │
                                                      │
                 ┌────────────────────────────────────┤
                 │                                    │
        ┌────────▼─────────┐              ┌──────────▼──────────┐
        │   PostgreSQL     │              │      Redis          │
        │                  │              │                     │
        │  - Venues        │              │  - Session Store    │
        │  - Events        │              │  - Queue State      │
        │  - Votes         │              │  - Rate Limiting    │
        │  - Queue Items   │              │  - Track Cache      │
        │  - Analytics     │              │  - Pub/Sub          │
        └──────────────────┘              └─────────────────────┘
                                                      │
                                          ┌───────────▼───────────┐
                                          │   Spotify Web API     │
                                          │                       │
                                          │  - Search Tracks      │
                                          │  - Get Recommendations│
                                          │  - Playback Control   │
                                          │  - OAuth              │
                                          └───────────────────────┘
```

## 🏛️ Architecture Patterns

### 1. Layered Architecture

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│  (Next.js Components, API Routes)       │
└───────────────┬─────────────────────────┘
                │
┌───────────────▼─────────────────────────┐
│         Application Layer               │
│  (Controllers, Guards, Interceptors)    │
└───────────────┬─────────────────────────┘
                │
┌───────────────▼─────────────────────────┐
│         Business Logic Layer            │
│  (Services, Domain Logic)               │
└───────────────┬─────────────────────────┘
                │
┌───────────────▼─────────────────────────┐
│         Data Access Layer               │
│  (Prisma, Repositories)                 │
└───────────────┬─────────────────────────┘
                │
┌───────────────▼─────────────────────────┐
│         Data Layer                      │
│  (PostgreSQL, Redis)                    │
└─────────────────────────────────────────┘
```

### 2. Event-Driven Architecture

```
Vote Submitted
     │
     ▼
┌─────────────┐
│ Vote Service│──► Store Vote (DB)
└─────────────┘
     │
     ├──► Update Queue (Redis)
     │
     ├──► Recalculate Scores
     │
     └──► Broadcast Update (WebSocket)
             │
             ▼
     ┌───────────────┐
     │  All Clients  │
     │  in Event     │
     └───────────────┘
```

### 3. Multi-Tenant Architecture

```
Request with venueId
     │
     ▼
┌─────────────────┐
│ Tenant Resolver │
└─────────────────┘
     │
     ▼
┌─────────────────┐
│ Venue Context   │◄── Scopes all queries
└─────────────────┘
     │
     ▼
All database queries include: WHERE venueId = ?
```

## 🔄 Data Flow

### Vote Submission Flow

```
1. Guest clicks "Vote" button
   │
   ▼
2. Frontend validates (rate limit, cooldown)
   │
   ▼
3. Send vote via HTTP POST /events/:id/votes
   │
   ▼
4. API validates request (DTO, guards)
   │
   ▼
5. Check rate limit (Redis)
   │
   ├─ Over limit? → Return 429 Error
   │
   ▼
6. Record vote in PostgreSQL
   │
   ▼
7. Update queue item (upsert, increment vote count)
   │
   ▼
8. Recalculate queue scores
   │
   ▼
9. Update Redis queue cache
   │
   ▼
10. Broadcast via WebSocket to all clients
    │
    ▼
11. Clients receive update and refresh UI
    │
    ▼
12. Return success response to voter
```

### Track Playback Flow

```
1. Current track ends (Spotify Web Playback SDK)
   │
   ▼
2. API receives playback ended event
   │
   ▼
3. Mark current track as played (DB)
   │
   ▼
4. Add to play history
   │
   ▼
5. Get next track from queue (highest score)
   │
   ▼
6. Send play command to Spotify
   │
   ▼
7. Update event.currentTrackId
   │
   ▼
8. Remove played track from queue
   │
   ▼
9. Broadcast "now playing" update to all clients
   │
   ▼
10. Clients update UI with new track
```

### Event Activation Flow

```
1. Admin clicks "Activate Event"
   │
   ▼
2. Load tracks based on playlist config
   │
   ├─ Genre-based → Fetch from Spotify Recommendations API
   ├─ Playlist-based → Fetch tracks from Spotify Playlist
   └─ Custom → Use provided track IDs
   │
   ▼
3. Cache tracks in Redis (key: tracks:event:${eventId})
   │
   ▼
4. Update event status to ACTIVE
   │
   ▼
5. Set activatedAt timestamp
   │
   ▼
6. Initialize empty queue
   │
   ▼
7. Broadcast event activated to all clients
   │
   ▼
8. Clients redirect to voting interface
```

## 🧩 Component Architecture

### Frontend Components

```
apps/web/
├── app/
│   ├── (guest)/
│   │   ├── page.tsx                    # Landing page
│   │   └── v/[slug]/event/[id]/
│   │       ├── page.tsx                # Voting interface
│   │       └── components/
│   │           ├── NowPlaying.tsx      # Current track display
│   │           ├── QueueList.tsx       # Upcoming tracks
│   │           ├── TrackBrowser.tsx    # Browse/search tracks
│   │           └── VoteButton.tsx      # Vote interaction
│   │
│   ├── (display)/
│   │   └── v/[slug]/display/
│   │       ├── page.tsx                # Display screen
│   │       └── components/
│   │           ├── FullScreenPlayer.tsx
│   │           ├── QueueCarousel.tsx
│   │           └── VoteActivity.tsx
│   │
│   └── api/                            # API routes for client-side
│       └── votes/
│           └── route.ts
│
└── lib/
    ├── socket.ts                       # Socket.io client setup
    ├── api-client.ts                   # API wrapper
    └── hooks/
        ├── useEvent.ts
        ├── useQueue.ts
        └── useVote.ts
```

### Backend Services

```
apps/api/src/
├── auth/                               # Authentication
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── jwt.strategy.ts
│   └── guards/
│       ├── jwt-auth.guard.ts
│       └── venue-owner.guard.ts
│
├── venues/                             # Venue management
│   ├── venues.controller.ts
│   ├── venues.service.ts
│   └── dto/
│
├── events/                             # Event management
│   ├── events.controller.ts
│   ├── events.service.ts
│   └── dto/
│
├── votes/                              # Voting logic
│   ├── votes.controller.ts
│   ├── votes.service.ts
│   ├── vote-rate-limit.guard.ts
│   └── dto/
│
├── queue/                              # Queue management
│   ├── queue.service.ts
│   ├── queue-algorithm.service.ts
│   └── dto/
│
├── spotify/                            # Spotify integration
│   ├── spotify.service.ts
│   ├── spotify-auth.service.ts
│   ├── spotify-playback.service.ts
│   └── dto/
│
├── websocket/                          # Real-time gateway
│   ├── events.gateway.ts
│   └── websocket.module.ts
│
└── common/                             # Shared utilities
    ├── decorators/
    ├── filters/
    ├── interceptors/
    └── pipes/
```

## 🔐 Security Architecture

### Authentication Flow

```
1. Venue Registration/Login
   │
   ▼
2. Generate JWT access token (expires 24h)
   │
   ▼
3. Generate refresh token (expires 30 days)
   │
   ▼
4. Store refresh token in HTTP-only cookie
   │
   ▼
5. Return access token to client
   │
   ▼
6. Client includes token in Authorization header
   │
   ▼
7. API validates token on each request
   │
   ├─ Valid? → Process request
   └─ Expired? → Return 401, client refreshes token
```

### Guest Session Management

```
1. Guest visits voting page
   │
   ▼
2. Frontend generates session fingerprint
   │  (Browser info + IP + timestamp)
   │
   ▼
3. Store sessionId in localStorage
   │
   ▼
4. Include sessionId in all vote requests
   │
   ▼
5. API tracks votes per sessionId
   │
   ▼
6. Rate limiting enforced per sessionId
```

### Authorization Layers

```
Route: POST /venues/:venueId/events
│
├─ Guard 1: JwtAuthGuard
│   └─ Valid JWT token?
│
├─ Guard 2: VenueOwnerGuard
│   └─ Token's venueId matches route param?
│
└─ Process request
```

## 📊 Scalability Considerations

### Horizontal Scaling

```
┌──────────────────────────────────────────┐
│         Load Balancer (Nginx/ALB)        │
└────────┬─────────┬─────────┬─────────────┘
         │         │         │
    ┌────▼────┐ ┌──▼────┐ ┌──▼────┐
    │ API #1  │ │ API #2│ │ API #3│
    └────┬────┘ └───┬───┘ └───┬───┘
         └──────────┼─────────┘
                    │
         ┌──────────▼──────────┐
         │   Redis Cluster     │
         │   (Pub/Sub + Cache) │
         └──────────┬──────────┘
                    │
         ┌──────────▼──────────┐
         │  PostgreSQL Primary │
         │   + Read Replicas   │
         └─────────────────────┘
```

### Caching Strategy

```
┌─────────────────────────────────────────┐
│ Cache Layers                            │
├─────────────────────────────────────────┤
│ L1: In-Memory (Node.js)                 │
│     - Genre configurations              │
│     - Active events (5 min TTL)         │
│                                         │
│ L2: Redis (Distributed)                 │
│     - Track lists (1 hour TTL)          │
│     - Queue state (real-time)           │
│     - Session data (1 hour TTL)         │
│     - Rate limit counters (1 hour TTL)  │
│                                         │
│ L3: CDN (CloudFlare)                    │
│     - Static assets                     │
│     - Public event data                 │
└─────────────────────────────────────────┘
```

### Database Optimization

```
Read Replicas:
┌──────────────┐     ┌───────────────┐
│   Primary    │────►│  Replica #1   │
│  (Writes)    │     │   (Reads)     │
└──────────────┘     └───────────────┘
                     ┌───────────────┐
                     │  Replica #2   │
                     │   (Reads)     │
                     └───────────────┘

Query Distribution:
- Writes → Primary
- Analytics/Reports → Replica #1
- Real-time reads → Replica #2
```

## 🔍 Monitoring Architecture

```
┌─────────────────────────────────────────┐
│         Application Metrics             │
│                                         │
│  API:                                   │
│  - Request count by endpoint            │
│  - Response times (p50, p95, p99)       │
│  - Error rates                          │
│  - Vote throughput                      │
│                                         │
│  WebSocket:                             │
│  - Active connections                   │
│  - Message rate                         │
│  - Broadcast latency                    │
│                                         │
│  Business Metrics:                      │
│  - Active events                        │
│  - Votes per minute                     │
│  - Unique voters                        │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│      Prometheus (Metrics Store)         │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│      Grafana (Visualization)            │
│                                         │
│  Dashboards:                            │
│  - System health                        │
│  - API performance                      │
│  - Business metrics                     │
│  - Real-time voting activity            │
└─────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│      AlertManager (Alerts)              │
│                                         │
│  Alerts:                                │
│  - High error rate (> 1%)               │
│  - Slow response times (> 1s p95)       │
│  - Database connection issues           │
│  - Redis unavailable                    │
│  - Spotify API failures                 │
└─────────────────────────────────────────┘
```

## 🔄 CI/CD Pipeline

```
┌─────────────┐
│  Git Push   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ GitHub      │
│ Actions     │
└──────┬──────┘
       │
       ├──► Lint & Format Check
       │
       ├──► Unit Tests
       │
       ├──► Integration Tests
       │
       ├──► Build Docker Images
       │
       ├──► Push to Registry
       │
       └──► Deploy (if main branch)
            │
            ▼
       ┌────────────┐
       │ Production │
       │ Deployment │
       └────────────┘
            │
            ├──► Rolling Update (Kubernetes)
            │
            ├──► Health Check
            │
            └──► Smoke Tests
```

## 📈 Performance Targets

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| API Response Time (p95) | < 500ms | Prometheus |
| Vote Processing Time | < 200ms | Application logs |
| WebSocket Latency | < 100ms | Custom metrics |
| Database Query Time (p95) | < 50ms | Prisma logging |
| Page Load Time | < 2s | Lighthouse |
| Time to Interactive | < 3s | Lighthouse |
| Concurrent Voters per Event | 500+ | Load testing |
| System Uptime | 99.5% | StatusPage |

## 🛡️ Disaster Recovery

### Backup Strategy

```
PostgreSQL:
- Full backup: Daily at 3 AM UTC
- Incremental: Every 6 hours
- Retention: 30 days
- Storage: S3 + Glacier

Redis:
- RDB snapshots: Every hour
- AOF enabled: Every second
- Retention: 7 days
```

### Recovery Procedures

```
Database Corruption:
1. Stop API servers
2. Restore from latest backup
3. Replay transaction logs
4. Verify data integrity
5. Start API servers
6. Monitor for errors

Redis Failure:
1. Automatic failover to replica
2. Rebuild cache from database
3. Monitor performance
4. Investigate root cause
```

---

**Architecture Version**: 1.0.0  
**Last Updated**: January 2026  
**Maintainer**: Olaf Kfreund
