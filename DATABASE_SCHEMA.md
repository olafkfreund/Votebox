# Votebox Database Schema

## 📊 Schema Overview

The Votebox database is designed for:

- Multi-tenant architecture (multiple venues)
- Event-based music sessions
- Real-time vote tracking
- Flexible playlist configurations
- Analytics and reporting

## 🗃️ Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   Venue     │──────<│    Event    │>──────│    Vote     │
│             │       │             │       │             │
└─────────────┘       └─────────────┘       └─────────────┘
       │                      │
       │                      │
       ▼                      ▼
┌─────────────┐       ┌─────────────┐
│Subscription │       │  QueueItem  │
│             │       │             │
└─────────────┘       └─────────────┘

┌─────────────┐       ┌─────────────┐
│    User     │       │   Session   │
│  (Admin)    │       │  (Guest)    │
└─────────────┘       └─────────────┘
```

## 📋 Complete Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================================
// CORE ENTITIES
// ============================================================================

model Venue {
  id                String   @id @default(cuid())
  name              String
  slug              String   @unique
  email             String   @unique
  hashedPassword    String

  // Spotify Integration
  spotifyAccountId  String?  @unique
  spotifyAccessToken String? @db.Text
  spotifyRefreshToken String? @db.Text
  spotifyTokenExpiry DateTime?

  // Settings
  settings          Json     @default("{}")
  // Example settings:
  // {
  //   "defaultVotesPerHour": 3,
  //   "defaultVoteCooldown": 30,
  //   "allowExplicit": true,
  //   "branding": {
  //     "logo": "...",
  //     "primaryColor": "#...",
  //     "secondaryColor": "#..."
  //   }
  // }

  // Metadata
  isActive          Boolean  @default(true)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  lastLoginAt       DateTime?

  // Relations
  events            Event[]
  subscription      Subscription?
  users             User[]

  @@index([slug])
  @@index([email])
  @@index([isActive])
}

model User {
  id             String   @id @default(cuid())
  venueId        String
  email          String   @unique
  hashedPassword String
  role           UserRole @default(STAFF)

  firstName      String
  lastName       String

  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  lastLoginAt    DateTime?

  venue          Venue    @relation(fields: [venueId], references: [id], onDelete: Cascade)

  @@index([venueId])
  @@index([email])
}

enum UserRole {
  OWNER
  ADMIN
  STAFF
}

// ============================================================================
// EVENTS & PLAYLISTS
// ============================================================================

model Event {
  id              String      @id @default(cuid())
  venueId         String

  // Basic Info
  name            String
  description     String?     @db.Text

  // Scheduling
  scheduledDate   DateTime    @db.Date
  startTime       DateTime
  endTime         DateTime
  timezone        String      @default("UTC")

  // Recurrence
  recurrence      Recurrence  @default(NONE)
  recurrenceEnd   DateTime?   @db.Date

  // Playlist Configuration
  playlistSource  PlaylistSource
  playlistConfig  Json
  // Example configs:
  // Genre-based: {
  //   "type": "genre",
  //   "genres": ["doom-metal", "stoner-rock"],
  //   "filters": {
  //     "explicit": true,
  //     "minPopularity": 20,
  //     "maxDuration": 600,
  //     "energy": [0.3, 0.7]
  //   }
  // }
  // Playlist-based: {
  //   "type": "spotify_playlist",
  //   "playlistId": "37i9dQZF1DX...",
  //   "filters": {...}
  // }
  // Custom: {
  //   "type": "custom",
  //   "trackIds": ["spotify:track:..."]
  // }

  // Voting Rules
  votingRules     Json        @default("{}")
  // Example:
  // {
  //   "votesPerHour": 3,
  //   "voteCooldown": 30,
  //   "replayCooldown": 7200,
  //   "maxVoteWeight": 10,
  //   "queueAlgorithm": "weighted"
  // }

  // State
  status          EventStatus @default(UPCOMING)
  activatedAt     DateTime?
  endedAt         DateTime?

  // Spotify Playback
  spotifyDeviceId String?
  currentTrackId  String?
  currentTrackStartedAt DateTime?

  // Stats
  totalVotes      Int         @default(0)
  totalTracks     Int         @default(0)
  uniqueVoters    Int         @default(0)

  // Metadata
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  // Relations
  venue           Venue       @relation(fields: [venueId], references: [id], onDelete: Cascade)
  votes           Vote[]
  queue           QueueItem[]
  playHistory     PlayHistory[]

  @@index([venueId, status])
  @@index([venueId, scheduledDate])
  @@index([status, startTime])
  @@index([currentTrackId])
}

enum Recurrence {
  NONE
  DAILY
  WEEKLY
  MONTHLY
}

enum PlaylistSource {
  GENRE
  SPOTIFY_PLAYLIST
  CUSTOM
}

enum EventStatus {
  UPCOMING
  ACTIVE
  ENDED
  CANCELLED
}

// ============================================================================
// VOTING & QUEUE
// ============================================================================

model Vote {
  id             String   @id @default(cuid())
  eventId        String
  sessionId      String   // Guest session identifier

  // Track Info
  trackId        String   // Spotify track ID
  trackName      String
  artistName     String
  albumArt       String?
  duration       Int      // in seconds

  // Vote Metadata
  votedAt        DateTime @default(now())
  weight         Int      @default(1)
  ipAddress      String?
  userAgent      String?

  // Relations
  event          Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)

  @@index([eventId, trackId])
  @@index([eventId, sessionId])
  @@index([eventId, votedAt])
  @@index([sessionId])
}

model QueueItem {
  id              String   @id @default(cuid())
  eventId         String

  // Track Info
  trackId         String   // Spotify track ID
  trackUri        String   // Full Spotify URI
  trackName       String
  artistName      String
  albumName       String
  albumArt        String?
  duration        Int      // in seconds

  // Queue Position
  position        Int
  score           Float    @default(0)

  // Vote Stats
  voteCount       Int      @default(0)
  lastVotedAt     DateTime?

  // Metadata
  addedAt         DateTime @default(now())
  addedBy         String   @default("system") // "system" or sessionId

  // State
  isPlayed        Boolean  @default(false)
  playedAt        DateTime?
  skipped         Boolean  @default(false)
  skippedReason   String?

  // Relations
  event           Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)

  @@unique([eventId, trackId])
  @@index([eventId, position])
  @@index([eventId, score])
  @@index([eventId, isPlayed])
}

model PlayHistory {
  id             String   @id @default(cuid())
  eventId        String

  // Track Info
  trackId        String
  trackUri       String
  trackName      String
  artistName     String
  albumName      String
  albumArt       String?
  duration       Int

  // Playback Info
  startedAt      DateTime
  endedAt        DateTime?
  completed      Boolean  @default(false)
  skipped        Boolean  @default(false)
  skipReason     String?

  // Stats
  voteCount      Int      @default(0)
  score          Float    @default(0)

  // Relations
  event          Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)

  @@index([eventId, startedAt])
  @@index([trackId])
}

// ============================================================================
// SESSIONS & RATE LIMITING
// ============================================================================

model Session {
  id             String   @id @default(cuid())
  sessionId      String   @unique

  // Session Info
  fingerprint    String   // Browser fingerprint
  ipAddress      String
  userAgent      String

  // Activity
  firstSeen      DateTime @default(now())
  lastSeen       DateTime @default(now())

  // Stats
  totalVotes     Int      @default(0)
  eventsVisited  String[] // Array of event IDs

  @@index([sessionId])
  @@index([fingerprint])
  @@index([lastSeen])
}

// ============================================================================
// SUBSCRIPTIONS & BILLING
// ============================================================================

model Subscription {
  id               String           @id @default(cuid())
  venueId          String           @unique

  // Plan Info
  plan             SubscriptionPlan @default(FREE)
  status           SubscriptionStatus @default(ACTIVE)

  // Billing
  stripeCustomerId String?          @unique
  stripeSubscriptionId String?      @unique

  // Period
  currentPeriodStart DateTime?
  currentPeriodEnd   DateTime?

  // Trial
  trialStart       DateTime?
  trialEnd         DateTime?

  // Metadata
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt
  cancelledAt      DateTime?

  // Relations
  venue            Venue            @relation(fields: [venueId], references: [id], onDelete: Cascade)
  invoices         Invoice[]

  @@index([venueId])
  @@index([status])
  @@index([stripeCustomerId])
}

enum SubscriptionPlan {
  FREE
  STARTER
  PRO
  ENTERPRISE
}

enum SubscriptionStatus {
  ACTIVE
  CANCELLED
  PAST_DUE
  UNPAID
  TRIALING
}

model Invoice {
  id               String   @id @default(cuid())
  subscriptionId   String

  // Stripe Info
  stripeInvoiceId  String   @unique

  // Invoice Details
  amount           Int      // in cents
  currency         String   @default("gbp")
  status           String   // paid, open, void, etc.

  // Dates
  invoiceDate      DateTime
  dueDate          DateTime?
  paidAt           DateTime?

  // Metadata
  createdAt        DateTime @default(now())

  // Relations
  subscription     Subscription @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)

  @@index([subscriptionId])
  @@index([stripeInvoiceId])
}

// ============================================================================
// ANALYTICS & METRICS
// ============================================================================

model VenueMetrics {
  id               String   @id @default(cuid())
  venueId          String
  date             DateTime @db.Date

  // Event Stats
  eventsActive     Int      @default(0)
  eventsTotal      Int      @default(0)

  // Vote Stats
  votesTotal       Int      @default(0)
  uniqueVoters     Int      @default(0)
  avgVotesPerEvent Float    @default(0)

  // Track Stats
  tracksPlayed     Int      @default(0)
  tracksSkipped    Int      @default(0)
  avgTrackDuration Float    @default(0)

  // Engagement
  peakConcurrentVoters Int  @default(0)
  avgSessionDuration   Float @default(0)

  createdAt        DateTime @default(now())

  @@unique([venueId, date])
  @@index([venueId, date])
}

// ============================================================================
// SYSTEM & CONFIGURATION
// ============================================================================

model GenreConfig {
  id               String   @id @default(cuid())
  code             String   @unique // e.g., "doom-metal"
  displayName      String   // e.g., "Doom Metal"

  // Spotify Seeds
  seedGenres       String[] // Spotify genre IDs
  seedArtists      String[] // Spotify artist IDs
  fallbackPlaylists String[] // Spotify playlist IDs

  // Filters (stored as JSON for flexibility)
  defaultFilters   Json     @default("{}")
  // Example:
  // {
  //   "energy": [0.3, 0.7],
  //   "tempo": [60, 120],
  //   "valence": [0.1, 0.4]
  // }

  // Metadata
  isActive         Boolean  @default(true)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@index([code])
  @@index([isActive])
}

model SystemConfig {
  id        String   @id @default(cuid())
  key       String   @unique
  value     Json

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([key])
}

// ============================================================================
// AUDIT LOG
// ============================================================================

model AuditLog {
  id         String   @id @default(cuid())

  // Who
  userId     String?
  venueId    String?
  sessionId  String?

  // What
  action     String   // "event.created", "track.skipped", etc.
  entity     String   // "event", "track", "vote"
  entityId   String?

  // Details
  metadata   Json     @default("{}")
  ipAddress  String?

  // When
  createdAt  DateTime @default(now())

  @@index([venueId, createdAt])
  @@index([action, createdAt])
  @@index([entity, entityId])
}
```

## 🔑 Key Design Decisions

### 1. Multi-Tenancy via venueId

Every event, vote, and queue item is scoped to a venue via `venueId`. This enables:

- Data isolation
- Per-venue billing
- Scalable architecture

### 2. JSON Columns for Flexibility

Used for:

- `playlistConfig`: Different event types need different configurations
- `settings`: Venue-specific preferences
- `votingRules`: Flexible voting algorithms

### 3. Separate QueueItem and Vote Tables

**Why not merge?**

- Votes are immutable history
- Queue is mutable state (positions change)
- Different query patterns
- Better performance

### 4. Session-based Guest Tracking

No user accounts for guests:

- Friction-free experience
- Privacy-friendly
- Session fingerprinting for rate limiting

### 5. Audit Logging

Track all important actions for:

- Debugging
- Security
- Analytics
- Compliance

## 📊 Common Queries

### Get Active Event for Venue

```typescript
const activeEvent = await prisma.event.findFirst({
  where: {
    venueId: venueId,
    status: 'ACTIVE',
  },
  include: {
    venue: true,
  },
});
```

### Get Queue for Event

```typescript
const queue = await prisma.queueItem.findMany({
  where: {
    eventId: eventId,
    isPlayed: false,
  },
  orderBy: [{ position: 'asc' }],
  take: 10,
});
```

### Record Vote and Update Queue

```typescript
await prisma.$transaction(async (tx) => {
  // Record vote
  await tx.vote.create({
    data: {
      eventId,
      sessionId,
      trackId,
      trackName,
      artistName,
      weight: 1,
    },
  });

  // Update or create queue item
  const queueItem = await tx.queueItem.upsert({
    where: {
      eventId_trackId: { eventId, trackId },
    },
    update: {
      voteCount: { increment: 1 },
      lastVotedAt: new Date(),
    },
    create: {
      eventId,
      trackId,
      trackUri,
      trackName,
      artistName,
      albumName,
      duration,
      voteCount: 1,
      position: 999, // Will be recalculated
    },
  });

  // Recalculate queue positions
  // (separate function)
});
```

### Get Venue Analytics

```typescript
const metrics = await prisma.venueMetrics.findMany({
  where: {
    venueId: venueId,
    date: {
      gte: startDate,
      lte: endDate,
    },
  },
  orderBy: { date: 'asc' },
});
```

### Check Rate Limit

```typescript
const recentVotes = await prisma.vote.count({
  where: {
    sessionId: sessionId,
    votedAt: {
      gte: oneHourAgo,
    },
  },
});

if (recentVotes >= 3) {
  throw new Error('Rate limit exceeded');
}
```

## 🚀 Migrations

### Initial Migration

```bash
npx prisma migrate dev --name init
```

### Generating Prisma Client

```bash
npx prisma generate
```

### Seeding Database

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create demo venue
  const venue = await prisma.venue.create({
    data: {
      name: "The Raven's Claw",
      slug: 'ravens-claw',
      email: 'owner@ravensclaw.com',
      hashedPassword: await hash('demo123', 10),
      settings: {
        defaultVotesPerHour: 3,
        allowExplicit: true,
      },
    },
  });

  // Create subscription
  await prisma.subscription.create({
    data: {
      venueId: venue.id,
      plan: 'FREE',
      status: 'ACTIVE',
    },
  });

  // Create genre configs
  await prisma.genreConfig.createMany({
    data: [
      {
        code: 'doom-metal',
        displayName: 'Doom Metal',
        seedGenres: ['doom-metal', 'stoner-rock'],
        seedArtists: ['4Qwx69EkNfTZAsZy6W9rDX'], // Electric Wizard
        fallbackPlaylists: ['37i9dQZF1DX5J7FIl4q56G'],
      },
      {
        code: 'black-metal',
        displayName: 'Black Metal',
        seedGenres: ['black-metal', 'norwegian-metal'],
        seedArtists: ['4VAdXJM8NfWCphEy0jNFQU'], // Darkthrone
        fallbackPlaylists: ['37i9dQZF1DWWOaP4H0w5b0'],
      },
    ],
  });

  console.log('Seed completed!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

## 🔍 Indexes for Performance

Key indexes defined:

- `venue.slug` - Fast lookup by URL
- `event.venueId + status` - Get active events
- `queueItem.eventId + position` - Ordered queue retrieval
- `vote.eventId + votedAt` - Time-based queries
- `session.sessionId` - Fast session lookup

## 🛡️ Data Integrity

### Constraints

- Unique constraints on slugs, emails
- Foreign key cascades for cleanup
- NOT NULL on critical fields

### Transactions

Use Prisma transactions for:

- Vote + Queue update (atomicity)
- Event activation (multiple updates)
- Payment + Subscription (consistency)

---

**Last Updated**: January 2026  
**Schema Version**: 1.0.0
