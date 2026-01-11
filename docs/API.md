# Votebox API Documentation

Complete API reference for the Votebox backend service.

**Base URL**: `http://localhost:4000/api/v1`
**Version**: 1.0.0
**Protocol**: REST + WebSocket

---

## Table of Contents

- [Authentication](#authentication)
- [Venue Management](#venue-management)
- [Event Management](#event-management)
- [Queue Management](#queue-management)
- [Admin Queue Controls](#admin-queue-controls)
- [Playback Automation](#playback-automation)
- [WebSocket Events](#websocket-events)
- [Error Responses](#error-responses)

---

## Authentication

**Status**: Not yet implemented (planned for Week 5-8)

Future authentication will use:
- JWT tokens
- Venue owner verification
- Role-based access control

---

## Venue Management

### Create Venue

**Endpoint**: `POST /venues`

**Description**: Register a new venue (pub/club)

**Request Body**:
```json
{
  "name": "The Metal Tavern",
  "slug": "metal-tavern",
  "description": "Underground metal bar in downtown",
  "address": "123 Metal St, Rock City, RC 12345",
  "phone": "+1-555-0123",
  "email": "info@metaltavern.com",
  "website": "https://metaltavern.com",
  "timezone": "America/New_York",
  "spotifyAccountEmail": "dj@metaltavern.com"
}
```

**Response**: `201 Created`
```json
{
  "id": "ven_abc123",
  "name": "The Metal Tavern",
  "slug": "metal-tavern",
  "description": "Underground metal bar in downtown",
  "address": "123 Metal St, Rock City, RC 12345",
  "phone": "+1-555-0123",
  "email": "info@metaltavern.com",
  "website": "https://metaltavern.com",
  "timezone": "America/New_York",
  "spotifyAccountEmail": "dj@metaltavern.com",
  "spotifyConnected": false,
  "createdAt": "2026-01-11T20:00:00Z",
  "updatedAt": "2026-01-11T20:00:00Z"
}
```

**Validation**:
- `name`: Required, 1-100 characters
- `slug`: Required, unique, URL-safe (lowercase, hyphens only)
- `email`: Required, valid email format
- `timezone`: Valid IANA timezone identifier

---

### Get Venue by Slug

**Endpoint**: `GET /venues/:slug`

**Description**: Retrieve venue details by URL-friendly slug

**Parameters**:
- `slug` (path): Venue slug (e.g., "metal-tavern")

**Response**: `200 OK`
```json
{
  "id": "ven_abc123",
  "name": "The Metal Tavern",
  "slug": "metal-tavern",
  "description": "Underground metal bar in downtown",
  "spotifyConnected": true,
  "createdAt": "2026-01-11T20:00:00Z"
}
```

**Errors**:
- `404 Not Found`: Venue not found

---

### Get All Venues

**Endpoint**: `GET /venues`

**Description**: List all registered venues

**Response**: `200 OK`
```json
[
  {
    "id": "ven_abc123",
    "name": "The Metal Tavern",
    "slug": "metal-tavern",
    "spotifyConnected": true
  },
  {
    "id": "ven_def456",
    "name": "Rock Paradise",
    "slug": "rock-paradise",
    "spotifyConnected": false
  }
]
```

---

### Update Venue

**Endpoint**: `PATCH /venues/:id`

**Description**: Update venue details

**Request Body** (all fields optional):
```json
{
  "name": "The New Metal Tavern",
  "description": "Updated description",
  "phone": "+1-555-9999"
}
```

**Response**: `200 OK` (returns updated venue)

---

### Delete Venue

**Endpoint**: `DELETE /venues/:id`

**Description**: Delete a venue and all associated events

**Response**: `200 OK`
```json
{
  "message": "Venue deleted successfully"
}
```

**Note**: This is a destructive operation that cascades to all events.

---

## Event Management

### Create Event

**Endpoint**: `POST /venues/:venueId/events`

**Description**: Create a new music event for a venue

**Request Body**:
```json
{
  "name": "Doom Rock Night",
  "description": "Heavy, slow, crushing riffs all night long",
  "scheduledStart": "2026-01-15T20:00:00Z",
  "scheduledEnd": "2026-01-16T02:00:00Z",
  "genres": ["doom-metal", "stoner-rock", "sludge"],
  "playlistId": "spotify:playlist:37i9dQZF1DX2LTcinqsO68",
  "votingEnabled": true,
  "maxVotesPerUser": 3
}
```

**Response**: `201 Created`
```json
{
  "id": "evt_123",
  "venueId": "ven_abc123",
  "name": "Doom Rock Night",
  "description": "Heavy, slow, crushing riffs all night long",
  "status": "UPCOMING",
  "scheduledStart": "2026-01-15T20:00:00Z",
  "scheduledEnd": "2026-01-16T02:00:00Z",
  "genres": ["doom-metal", "stoner-rock", "sludge"],
  "playlistId": "spotify:playlist:37i9dQZF1DX2LTcinqsO68",
  "votingEnabled": true,
  "maxVotesPerUser": 3,
  "totalTracks": 0,
  "createdAt": "2026-01-11T20:00:00Z"
}
```

**Validation**:
- `name`: Required, 3-100 characters
- `scheduledStart`: Required, ISO 8601 datetime
- `scheduledEnd`: Optional, must be after scheduledStart

---

### Get Event by ID

**Endpoint**: `GET /events/:id`

**Description**: Retrieve event details

**Response**: `200 OK`
```json
{
  "id": "evt_123",
  "venueId": "ven_abc123",
  "name": "Doom Rock Night",
  "status": "ACTIVE",
  "scheduledStart": "2026-01-15T20:00:00Z",
  "actualStart": "2026-01-15T20:05:23Z",
  "totalTracks": 47,
  "venue": {
    "id": "ven_abc123",
    "name": "The Metal Tavern",
    "slug": "metal-tavern"
  }
}
```

---

### List Events for Venue

**Endpoint**: `GET /venues/:venueId/events`

**Description**: List all events for a specific venue

**Query Parameters**:
- `status` (optional): Filter by status (`UPCOMING`, `ACTIVE`, `ENDED`)
- `limit` (optional): Limit results (default: 50)

**Response**: `200 OK`
```json
[
  {
    "id": "evt_123",
    "name": "Doom Rock Night",
    "status": "ACTIVE",
    "scheduledStart": "2026-01-15T20:00:00Z"
  },
  {
    "id": "evt_124",
    "name": "Thrash Thursday",
    "status": "UPCOMING",
    "scheduledStart": "2026-01-16T21:00:00Z"
  }
]
```

---

### Start Event

**Endpoint**: `POST /events/:id/start`

**Description**: Start an event (changes status to ACTIVE)

**Response**: `200 OK`
```json
{
  "id": "evt_123",
  "status": "ACTIVE",
  "actualStart": "2026-01-15T20:05:23Z"
}
```

**Errors**:
- `400 Bad Request`: Event already active or ended
- `404 Not Found`: Event not found

---

### End Event

**Endpoint**: `POST /events/:id/end`

**Description**: End an event (changes status to ENDED)

**Response**: `200 OK`
```json
{
  "id": "evt_123",
  "status": "ENDED",
  "actualEnd": "2026-01-16T02:15:00Z",
  "totalTracks": 47
}
```

---

### Delete Event

**Endpoint**: `DELETE /events/:id`

**Description**: Delete an event and all associated queue items

**Response**: `200 OK`
```json
{
  "message": "Event deleted successfully"
}
```

---

## Queue Management

### Add Track to Queue (Vote)

**Endpoint**: `POST /events/:eventId/queue`

**Description**: Add a track to the queue or increment votes for existing track

**Request Body**:
```json
{
  "trackId": "3BSpsSH5jqIH0WdnoXMfYc",
  "trackUri": "spotify:track:3BSpsSH5jqIH0WdnoXMfYc",
  "trackName": "Dopesmoker",
  "artistName": "Sleep",
  "albumName": "Dopesmoker",
  "albumArt": "https://i.scdn.co/image/ab67616d0000b273...",
  "duration": 3841000,
  "addedBy": "sess_abc123_xyz789_fin456"
}
```

**Response**: `201 Created` (new track) or `200 OK` (vote incremented)
```json
{
  "id": "queue_789",
  "eventId": "evt_123",
  "trackId": "3BSpsSH5jqIH0WdnoXMfYc",
  "trackName": "Dopesmoker",
  "artistName": "Sleep",
  "albumName": "Dopesmoker",
  "albumArt": "https://i.scdn.co/image/ab67616d0000b273...",
  "duration": 3841000,
  "position": 3,
  "score": 45,
  "voteCount": 3,
  "lastVotedAt": "2026-01-15T20:15:00Z",
  "addedAt": "2026-01-15T20:10:00Z",
  "isPlayed": false
}
```

**Rate Limiting** (4 layers):
1. **30-second cooldown**: `429 Too Many Requests`
   ```json
   {
     "statusCode": 429,
     "message": "Please wait 25 seconds before voting again"
   }
   ```

2. **3 votes per hour per session**: `429 Too Many Requests`
   ```json
   {
     "statusCode": 429,
     "message": "You've used all 3 votes this hour. Next vote available at 9:15 PM"
   }
   ```

3. **2-hour same-song cooldown**: `400 Bad Request`
   ```json
   {
     "statusCode": 400,
     "message": "You already voted for this track. Try again at 10:00 PM"
   }
   ```

4. **6 votes per hour per IP**: `429 Too Many Requests`
   ```json
   {
     "statusCode": 429,
     "message": "Too many votes from this network. Please try again later."
   }
   ```

**Validation**:
- `trackId`: Required, Spotify track ID
- `addedBy`: Required, session ID
- Event must be ACTIVE

---

### Get Queue

**Endpoint**: `GET /events/:eventId/queue`

**Description**: Get current queue ordered by score

**Response**: `200 OK`
```json
[
  {
    "id": "queue_789",
    "trackName": "Dopesmoker",
    "artistName": "Sleep",
    "albumArt": "https://...",
    "duration": 3841000,
    "position": 1,
    "score": 65,
    "voteCount": 5,
    "lastVotedAt": "2026-01-15T20:30:00Z"
  },
  {
    "id": "queue_790",
    "trackName": "Holy Mountain",
    "artistName": "Sleep",
    "position": 2,
    "score": 45,
    "voteCount": 3
  }
]
```

**Ordering**:
1. Score (descending)
2. Added at (ascending) - tie-breaker

---

### Get Queue Stats

**Endpoint**: `GET /events/:eventId/queue/stats`

**Description**: Get queue statistics

**Response**: `200 OK`
```json
{
  "totalTracks": 47,
  "totalVotes": 152,
  "playedTracks": 23,
  "skippedTracks": 2
}
```

---

### Get Remaining Votes

**Endpoint**: `GET /events/:eventId/queue/remaining-votes/:sessionId`

**Description**: Get remaining votes for a session in current hour

**Response**: `200 OK`
```json
{
  "remaining": 2,
  "total": 3,
  "nextResetAt": "2026-01-15T21:00:00Z"
}
```

---

### Get Next Track

**Endpoint**: `GET /events/:eventId/queue/next`

**Description**: Get the next track to be played (highest score)

**Response**: `200 OK`
```json
{
  "id": "queue_789",
  "trackUri": "spotify:track:3BSpsSH5jqIH0WdnoXMfYc",
  "trackName": "Dopesmoker",
  "artistName": "Sleep",
  "score": 65,
  "voteCount": 5
}
```

**Response**: `204 No Content` (queue empty)

---

## Admin Queue Controls

**Note**: All admin endpoints require authentication (to be implemented).

### Clear Queue

**Endpoint**: `DELETE /admin/events/:eventId/queue/clear`

**Description**: Emergency clear - remove all unplayed tracks

**Response**: `200 OK`
```json
{
  "message": "Queue cleared successfully",
  "deletedCount": 15
}
```

---

### Force Skip Track

**Endpoint**: `POST /admin/events/:eventId/queue/:trackId/force-skip`

**Description**: Skip a track without playing it

**Query Parameters**:
- `reason` (optional): Reason for skipping

**Example**: `POST /admin/events/evt_123/queue/track_456/force-skip?reason=inappropriate`

**Response**: `200 OK`
```json
{
  "id": "queue_789",
  "trackId": "track_456",
  "isPlayed": true,
  "skipped": true,
  "skippedReason": "inappropriate",
  "playedAt": "2026-01-15T20:45:00Z"
}
```

---

### Remove Track

**Endpoint**: `DELETE /admin/events/:eventId/queue/:trackId`

**Description**: Remove a track from the queue

**Response**: `200 OK`
```json
{
  "message": "Track removed from queue successfully",
  "trackId": "track_456"
}
```

---

### Recalculate Scores

**Endpoint**: `POST /admin/events/:eventId/queue/recalculate-scores`

**Description**: Manually recalculate all queue scores

**Response**: `200 OK`
```json
{
  "message": "Scores recalculated successfully",
  "updatedCount": 12
}
```

---

## Playback Automation

Automated playback endpoints for controlling Spotify playback on venue devices.

### Initialize Playback

**Endpoint**: `POST /events/:eventId/playback/initialize`

**Description**: Initialize automated playback on a Spotify device

**Request Body**:
```json
{
  "deviceId": "spotify-device-id"
}
```

**Response**: `200 OK`
```json
{
  "message": "Playback initialized successfully",
  "deviceId": "spotify-device-id"
}
```

**Errors**:
- `400 Bad Request`: Event not active or invalid device
- `404 Not Found`: Event or device not found

**Notes**:
- Must be called before using other playback endpoints
- Device must be an active Spotify device (computer, phone, speaker, etc.)
- Use Spotify's Web API `/me/player/devices` to get available devices

---

### Play Next Track

**Endpoint**: `POST /events/:eventId/playback/play-next`

**Description**: Play the next highest-scoring track from the queue

**Response**: `200 OK`
```json
{
  "message": "Track started playing",
  "nowPlaying": {
    "id": "queue_789",
    "trackUri": "spotify:track:...",
    "trackName": "Dopesmoker",
    "artistName": "Sleep",
    "albumName": "Dopesmoker",
    "albumArt": "https://...",
    "duration": 3841000,
    "startedAt": "2026-01-15T20:30:00Z"
  }
}
```

**Empty Queue Response**: `200 OK`
```json
{
  "message": "Queue is empty",
  "nowPlaying": null
}
```

**Errors**:
- `400 Bad Request`: Playback not initialized or Spotify error
- `404 Not Found`: Event not found

**Behavior**:
- Automatically marks track as played in queue
- Broadcasts `nowPlayingUpdate` via WebSocket
- Schedules automatic transition when track ends (if auto-play enabled)

---

### Pause Playback

**Endpoint**: `POST /events/:eventId/playback/pause`

**Description**: Pause the currently playing track

**Response**: `200 OK`
```json
{
  "message": "Playback paused"
}
```

**Errors**:
- `400 Bad Request`: Playback already paused or not initialized
- `404 Not Found`: Event not found

---

### Resume Playback

**Endpoint**: `POST /events/:eventId/playback/resume`

**Description**: Resume the current track or play next if no current track

**Response**: `200 OK`
```json
{
  "message": "Playback resumed"
}
```

**Errors**:
- `400 Bad Request`: Playback already active or not initialized
- `404 Not Found`: Event not found

**Behavior**:
- Resumes current track if paused
- Plays next track if no current track
- Re-schedules automatic transition

---

### Skip to Next Track

**Endpoint**: `POST /events/:eventId/playback/skip`

**Description**: Immediately skip to the next track in queue

**Response**: `200 OK` (same as play-next response)

**Errors**:
- `400 Bad Request`: Playback not initialized
- `404 Not Found`: Event not found

**Behavior**:
- Clears any pending automatic transitions
- Immediately plays highest-scoring track from queue

---

### Enable/Disable Auto-Play

**Endpoint**: `POST /events/:eventId/playback/auto-play`

**Description**: Control automatic track transitions

**Request Body**:
```json
{
  "enabled": true
}
```

**Response**: `200 OK`
```json
{
  "message": "Auto-play enabled",
  "autoPlayEnabled": true
}
```

**Errors**:
- `400 Bad Request`: Playback not initialized

**Behavior**:
- When enabled: Automatically plays next track when current track ends
- When disabled: Playback stops after current track finishes
- Default: Enabled on initialization

---

### Get Playback Status

**Endpoint**: `GET /events/:eventId/playback/status`

**Description**: Get current playback state and progress

**Response**: `200 OK` (Initialized)
```json
{
  "eventId": "evt_123",
  "initialized": true,
  "isPlaying": true,
  "deviceId": "spotify-device-id",
  "currentTrack": {
    "trackId": "track-123",
    "trackName": "Dopesmoker",
    "artistName": "Sleep",
    "albumArt": "https://...",
    "duration": 3841000,
    "startedAt": "2026-01-15T20:30:00Z",
    "elapsed": 45000,
    "remaining": 3796000
  },
  "autoPlayEnabled": true
}
```

**Response**: `200 OK` (Not Initialized)
```json
{
  "eventId": "evt_123",
  "initialized": false,
  "isPlaying": false,
  "currentTrack": null,
  "autoPlayEnabled": false
}
```

**Notes**:
- `elapsed`: Milliseconds since track started
- `remaining`: Milliseconds until track ends
- No authentication required (read-only)

---

### Stop Playback

**Endpoint**: `POST /events/:eventId/playback/stop`

**Description**: Stop playback and cleanup state

**Response**: `200 OK`
```json
{
  "message": "Playback stopped"
}
```

**Errors**:
- `404 Not Found`: Playback not initialized

**Behavior**:
- Pauses Spotify playback
- Clears playback state for event
- Broadcasts `nowPlayingUpdate` with null
- Requires re-initialization to resume

---

## WebSocket Events

**Connection**: `ws://localhost:4000` (or configured WS_URL)

### Client → Server

#### Join Event Room

**Event**: `joinEvent`

**Payload**:
```json
{
  "eventId": "evt_123"
}
```

**Response**:
```json
{
  "success": true
}
```

---

#### Leave Event Room

**Event**: `leaveEvent`

**Payload**:
```json
{
  "eventId": "evt_123"
}
```

---

### Server → Client

#### Queue Update

**Event**: `queueUpdate`

**Triggered by**:
- New vote/track added
- Track removed
- Track skipped
- Score recalculation
- Admin actions

**Payload**:
```json
{
  "eventId": "evt_123",
  "queue": [
    {
      "id": "queue_789",
      "trackName": "Dopesmoker",
      "artistName": "Sleep",
      "score": 65,
      "voteCount": 5,
      "position": 1
    }
  ]
}
```

---

#### Now Playing Update

**Event**: `nowPlayingUpdate`

**Triggered by**: Track starts playing

**Payload**:
```json
{
  "eventId": "evt_123",
  "track": {
    "id": "queue_789",
    "trackUri": "spotify:track:...",
    "trackName": "Dopesmoker",
    "artistName": "Sleep",
    "albumArt": "https://...",
    "duration": 3841000
  }
}
```

---

#### Event Status Change

**Event**: `eventStatusChange`

**Triggered by**: Event started/ended

**Payload**:
```json
{
  "eventId": "evt_123",
  "status": "ACTIVE",
  "actualStart": "2026-01-15T20:05:23Z"
}
```

---

## Error Responses

### Standard Error Format

All errors follow this format:

```json
{
  "statusCode": 400,
  "message": "Descriptive error message",
  "error": "Bad Request"
}
```

---

### Common Status Codes

- `200 OK`: Successful GET/PATCH/DELETE
- `201 Created`: Successful POST (resource created)
- `204 No Content`: Successful but no response body
- `400 Bad Request`: Invalid request data or business logic error
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

---

### Validation Errors

**Example**: Missing required field

```json
{
  "statusCode": 400,
  "message": [
    "name must be longer than or equal to 3 characters",
    "name should not be empty"
  ],
  "error": "Bad Request"
}
```

---

## Rate Limits

### Global Rate Limits
- **Not yet implemented**: Future versions will have API-wide rate limiting

### Vote-Specific Rate Limits
See [Add Track to Queue](#add-track-to-queue-vote) for detailed vote rate limiting rules.

---

## Pagination

**Status**: Not yet implemented

Future endpoints will support:
- `limit`: Number of results per page
- `offset`: Starting position
- Response headers with total count

---

## Webhooks

**Status**: Not yet implemented (planned for post-MVP)

Future webhook events:
- Event started/ended
- Track played/skipped
- Vote milestones reached

---

## API Versioning

**Current Version**: v1
**URL Pattern**: `/api/v1/*`

Breaking changes will increment the major version (v2, v3, etc.)

---

## SDK & Client Libraries

**Status**: Not yet available

Future plans:
- TypeScript/JavaScript SDK
- Python SDK
- API client generators (OpenAPI/Swagger)

---

## Testing

**Swagger UI**: `http://localhost:4000/api` (development only)

**Postman Collection**: Coming soon

---

## Support

For API issues or questions:
- GitHub Issues: https://github.com/olafkfreund/Votebox/issues
- Documentation: https://github.com/olafkfreund/Votebox/tree/main/docs
