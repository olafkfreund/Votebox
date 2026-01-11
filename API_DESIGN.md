# Votebox API Design

## 🎯 API Overview

**Base URL**: `https://api.votebox.io/v1`  
**Protocol**: REST + WebSocket  
**Authentication**: JWT Bearer tokens  
**Content-Type**: `application/json`

## 🔐 Authentication

### Public Endpoints (No Auth Required)
- GET `/health` - Health check
- POST `/auth/venue/login` - Venue login
- POST `/auth/venue/register` - Venue registration
- GET `/events/:eventId/public` - Public event info
- GET `/queue/:eventId` - Queue for display screens

### Protected Endpoints
- Require `Authorization: Bearer <token>` header
- Token expires after 24 hours
- Refresh token valid for 30 days

### Venue Authentication Flow
```typescript
// 1. Login
POST /auth/venue/login
{
  "email": "owner@venue.com",
  "password": "secretpassword"
}

Response:
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "venue": { ... }
}

// 2. Refresh Token
POST /auth/venue/refresh
{
  "refreshToken": "eyJ..."
}

Response:
{
  "accessToken": "eyJ..."
}
```

## 📋 REST API Endpoints

### Venues

#### Create Venue (Registration)
```http
POST /auth/venue/register
Content-Type: application/json

{
  "name": "The Raven's Claw",
  "slug": "ravens-claw",
  "email": "owner@ravensclaw.com",
  "password": "securepassword"
}

Response: 201 Created
{
  "venue": {
    "id": "clx...",
    "name": "The Raven's Claw",
    "slug": "ravens-claw",
    "email": "owner@ravensclaw.com"
  },
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

#### Get Venue Details
```http
GET /venues/:venueId
Authorization: Bearer eyJ...

Response: 200 OK
{
  "id": "clx...",
  "name": "The Raven's Claw",
  "slug": "ravens-claw",
  "spotifyAccountId": "spotify123",
  "settings": { ... },
  "subscription": {
    "plan": "PRO",
    "status": "ACTIVE"
  }
}
```

#### Update Venue
```http
PATCH /venues/:venueId
Authorization: Bearer eyJ...
Content-Type: application/json

{
  "settings": {
    "defaultVotesPerHour": 5,
    "branding": {
      "primaryColor": "#8B0000"
    }
  }
}

Response: 200 OK
```

### Spotify Integration

#### Connect Spotify Account
```http
GET /venues/:venueId/spotify/auth
Authorization: Bearer eyJ...

Response: 302 Redirect
Location: https://accounts.spotify.com/authorize?client_id=...
```

#### Handle Spotify Callback
```http
GET /venues/:venueId/spotify/callback?code=AQD...
Authorization: Bearer eyJ...

Response: 200 OK
{
  "success": true,
  "spotifyAccountId": "spotify123"
}
```

#### Get Spotify Devices
```http
GET /venues/:venueId/spotify/devices
Authorization: Bearer eyJ...

Response: 200 OK
{
  "devices": [
    {
      "id": "device123",
      "name": "Web Player",
      "type": "Computer",
      "isActive": true
    }
  ]
}
```

### Events

#### List Events
```http
GET /venues/:venueId/events?status=ACTIVE&limit=10&offset=0
Authorization: Bearer eyJ...

Response: 200 OK
{
  "events": [
    {
      "id": "clx...",
      "name": "Doom Rock Night",
      "scheduledDate": "2026-01-15",
      "startTime": "2026-01-15T20:00:00Z",
      "endTime": "2026-01-16T02:00:00Z",
      "status": "ACTIVE",
      "playlistSource": "GENRE",
      "totalVotes": 234,
      "uniqueVoters": 45
    }
  ],
  "total": 1,
  "limit": 10,
  "offset": 0
}
```

#### Create Event
```http
POST /venues/:venueId/events
Authorization: Bearer eyJ...
Content-Type: application/json

{
  "name": "Black Metal Night",
  "description": "Norwegian black metal classics",
  "scheduledDate": "2026-01-20",
  "startTime": "2026-01-20T20:00:00Z",
  "endTime": "2026-01-21T02:00:00Z",
  "playlistSource": "GENRE",
  "playlistConfig": {
    "type": "genre",
    "genres": ["black-metal", "norwegian-metal"],
    "filters": {
      "explicit": true,
      "minPopularity": 10,
      "tempo": [140, 220]
    }
  },
  "votingRules": {
    "votesPerHour": 3,
    "voteCooldown": 30,
    "replayCooldown": 7200
  }
}

Response: 201 Created
{
  "id": "clx...",
  "name": "Black Metal Night",
  "status": "UPCOMING",
  ...
}
```

#### Update Event
```http
PATCH /venues/:venueId/events/:eventId
Authorization: Bearer eyJ...
Content-Type: application/json

{
  "name": "Updated Event Name",
  "votingRules": {
    "votesPerHour": 5
  }
}

Response: 200 OK
```

#### Activate Event
```http
POST /venues/:venueId/events/:eventId/activate
Authorization: Bearer eyJ...

Response: 200 OK
{
  "id": "clx...",
  "status": "ACTIVE",
  "activatedAt": "2026-01-15T20:00:00Z",
  "totalTracks": 347
}
```

#### End Event
```http
POST /venues/:venueId/events/:eventId/end
Authorization: Bearer eyJ...

Response: 200 OK
{
  "id": "clx...",
  "status": "ENDED",
  "endedAt": "2026-01-16T02:00:00Z"
}
```

#### Get Event Details
```http
GET /events/:eventId
# No auth required for public access

Response: 200 OK
{
  "id": "clx...",
  "name": "Black Metal Night",
  "venue": {
    "name": "The Raven's Claw",
    "slug": "ravens-claw"
  },
  "status": "ACTIVE",
  "startTime": "2026-01-20T20:00:00Z",
  "endTime": "2026-01-21T02:00:00Z",
  "votingRules": { ... },
  "nowPlaying": {
    "trackId": "spotify:track:abc",
    "trackName": "Freezing Moon",
    "artistName": "Mayhem",
    "albumArt": "https://...",
    "startedAt": "2026-01-20T20:15:00Z",
    "duration": 397
  }
}
```

### Tracks & Search

#### Search Tracks for Event
```http
GET /events/:eventId/tracks/search?q=darkthrone&limit=20
# No auth required

Response: 200 OK
{
  "tracks": [
    {
      "id": "spotify:track:...",
      "name": "Transilvanian Hunger",
      "artists": ["Darkthrone"],
      "album": "Transilvanian Hunger",
      "albumArt": "https://...",
      "duration": 369,
      "voteCount": 5,
      "canVote": true
    }
  ],
  "total": 20
}
```

#### Browse Event Tracks
```http
GET /events/:eventId/tracks?limit=50&offset=0&sort=popular
# No auth required

Response: 200 OK
{
  "tracks": [ ... ],
  "total": 347,
  "limit": 50,
  "offset": 0
}
```

### Voting

#### Submit Vote
```http
POST /events/:eventId/votes
Content-Type: application/json

{
  "trackId": "spotify:track:...",
  "sessionId": "generated-session-id"
}

Response: 201 Created
{
  "id": "clx...",
  "trackId": "spotify:track:...",
  "voteCount": 6,
  "queuePosition": 3,
  "cooldownSeconds": 30
}

Error Response: 429 Too Many Requests
{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "You can vote again in 15 seconds",
  "retryAfter": 15
}
```

#### Get Vote Status
```http
GET /events/:eventId/votes/status?sessionId=...
# No auth required

Response: 200 OK
{
  "canVote": true,
  "votesRemaining": 2,
  "nextVoteAt": null,
  "recentVotes": [
    {
      "trackName": "Freezing Moon",
      "votedAt": "2026-01-20T20:15:00Z"
    }
  ]
}
```

### Queue

#### Get Queue
```http
GET /events/:eventId/queue?limit=10
# No auth required

Response: 200 OK
{
  "nowPlaying": {
    "trackId": "spotify:track:...",
    "trackName": "Freezing Moon",
    "artistName": "Mayhem",
    "albumArt": "https://...",
    "startedAt": "2026-01-20T20:15:00Z",
    "duration": 397,
    "progress": 45
  },
  "queue": [
    {
      "position": 1,
      "trackId": "spotify:track:...",
      "trackName": "Transilvanian Hunger",
      "artistName": "Darkthrone",
      "voteCount": 12,
      "score": 12.5
    }
  ]
}
```

#### Skip Track (Admin)
```http
POST /events/:eventId/queue/skip
Authorization: Bearer eyJ...
Content-Type: application/json

{
  "reason": "Inappropriate content"
}

Response: 200 OK
{
  "skipped": {
    "trackName": "...",
    "reason": "Inappropriate content"
  },
  "nowPlaying": { ... }
}
```

### Analytics

#### Get Event Analytics
```http
GET /venues/:venueId/events/:eventId/analytics
Authorization: Bearer eyJ...

Response: 200 OK
{
  "totalVotes": 234,
  "uniqueVoters": 45,
  "tracksPlayed": 32,
  "tracksSkipped": 2,
  "avgVotesPerTrack": 7.3,
  "peakVoters": 18,
  "popularTracks": [
    {
      "trackName": "Freezing Moon",
      "artistName": "Mayhem",
      "voteCount": 23
    }
  ],
  "voteTimeline": [
    {
      "time": "2026-01-20T20:00:00Z",
      "votes": 12
    }
  ]
}
```

#### Get Venue Analytics
```http
GET /venues/:venueId/analytics?startDate=2026-01-01&endDate=2026-01-31
Authorization: Bearer eyJ...

Response: 200 OK
{
  "period": {
    "start": "2026-01-01",
    "end": "2026-01-31"
  },
  "metrics": {
    "eventsTotal": 12,
    "votesTotal": 2847,
    "uniqueVoters": 234,
    "avgVotesPerEvent": 237,
    "topGenres": [
      { "genre": "black-metal", "votes": 843 }
    ]
  }
}
```

### Genre Configuration

#### List Genres
```http
GET /genres
# No auth required

Response: 200 OK
{
  "genres": [
    {
      "code": "doom-metal",
      "displayName": "Doom Metal",
      "description": "Slow, heavy, atmospheric metal"
    },
    {
      "code": "black-metal",
      "displayName": "Black Metal",
      "description": "Raw, atmospheric extreme metal"
    }
  ]
}
```

## 🔌 WebSocket API

### Connection
```typescript
// Client connects
const socket = io('wss://api.votebox.io', {
  query: {
    eventId: 'clx...'
  }
});
```

### Events (Client → Server)

#### Join Event Room
```typescript
socket.emit('joinEvent', {
  eventId: 'clx...',
  sessionId: 'session123'
});
```

#### Leave Event Room
```typescript
socket.emit('leaveEvent', {
  eventId: 'clx...'
});
```

### Events (Server → Client)

#### Vote Update
```typescript
socket.on('voteUpdate', (data) => {
  // {
  //   trackId: 'spotify:track:...',
  //   trackName: '...',
  //   voteCount: 13,
  //   queuePosition: 2
  // }
});
```

#### Queue Update
```typescript
socket.on('queueUpdate', (data) => {
  // {
  //   queue: [
  //     {
  //       position: 1,
  //       trackId: '...',
  //       voteCount: 13
  //     }
  //   ]
  // }
});
```

#### Now Playing Update
```typescript
socket.on('nowPlayingUpdate', (data) => {
  // {
  //   trackId: 'spotify:track:...',
  //   trackName: 'Freezing Moon',
  //   artistName: 'Mayhem',
  //   albumArt: 'https://...',
  //   startedAt: '2026-01-20T20:15:00Z',
  //   duration: 397
  // }
});
```

#### Track Skipped
```typescript
socket.on('trackSkipped', (data) => {
  // {
  //   skipped: {
  //     trackName: '...',
  //     reason: 'Inappropriate content'
  //   },
  //   nowPlaying: { ... }
  // }
});
```

#### Event Status Change
```typescript
socket.on('eventStatusChange', (data) => {
  // {
  //   eventId: 'clx...',
  //   status: 'ENDED',
  //   message: 'Event has ended'
  // }
});
```

#### Connection Count
```typescript
socket.on('connectionCount', (data) => {
  // {
  //   count: 45,
  //   change: +2
  // }
});
```

## 🚨 Error Responses

### Standard Error Format
```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": {
    "field": "Additional context"
  }
}
```

### Common Error Codes

| Status | Error Code | Description |
|--------|-----------|-------------|
| 400 | `VALIDATION_ERROR` | Invalid request data |
| 401 | `UNAUTHORIZED` | Missing or invalid token |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 404 | `NOT_FOUND` | Resource not found |
| 409 | `CONFLICT` | Resource conflict (e.g., duplicate slug) |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Server error |

### Voting-Specific Errors

| Error Code | Description |
|-----------|-------------|
| `VOTE_COOLDOWN` | Must wait before voting again |
| `EVENT_NOT_ACTIVE` | Event is not currently active |
| `TRACK_NOT_AVAILABLE` | Track not in event playlist |
| `MAX_VOTES_REACHED` | Hourly vote limit reached |
| `TRACK_RECENTLY_PLAYED` | Track on replay cooldown |

## 📊 Rate Limiting

### Limits by Endpoint Type

| Endpoint Type | Rate Limit | Window |
|--------------|-----------|--------|
| Public reads | 100 req/min | Per IP |
| Voting | 3 votes/hour | Per session |
| Admin writes | 30 req/min | Per token |
| Search | 20 req/min | Per IP |

### Rate Limit Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 73
X-RateLimit-Reset: 1610000000
```

## 🔒 Security

### CORS Configuration
```typescript
{
  origin: [
    'https://votebox.io',
    'https://*.votebox.io',
    /localhost:\d{4}$/
  ],
  credentials: true
}
```

### API Key (Future Feature)
```http
X-API-Key: vb_live_...
```

For third-party integrations and white-label deployments.

## 📝 Pagination

### Query Parameters
```
?limit=20&offset=0
```

### Response Format
```json
{
  "data": [ ... ],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

## 🔍 Filtering & Sorting

### Events
```
GET /venues/:venueId/events?status=ACTIVE&sort=startTime&order=desc
```

### Analytics
```
GET /venues/:venueId/analytics?startDate=2026-01-01&endDate=2026-01-31&groupBy=day
```

## 📚 API Versioning

Current version: `v1`

Future versions accessible via:
- URL: `/v2/...`
- Header: `Accept: application/vnd.votebox.v2+json`

## 🧪 Testing Endpoints

### Health Check
```http
GET /health

Response: 200 OK
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime": 123456,
  "timestamp": "2026-01-20T20:00:00Z"
}
```

### Database Health
```http
GET /health/database

Response: 200 OK
{
  "status": "connected",
  "latency": 12
}
```

---

**API Version**: 1.0.0  
**Last Updated**: January 2026  
**Documentation**: https://docs.votebox.io
