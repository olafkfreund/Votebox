// Core enums
export enum EventStatus {
  UPCOMING = 'UPCOMING',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum SubscriptionTier {
  FREE = 'FREE',
  STARTER = 'STARTER',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  PAST_DUE = 'PAST_DUE',
  TRIALING = 'TRIALING',
}

export enum UserRole {
  VENUE_OWNER = 'VENUE_OWNER',
  ADMIN = 'ADMIN',
}

// Core types
export interface Venue {
  id: string;
  name: string;
  slug: string;
  spotifyAccountId: string | null;
  settings: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Event {
  id: string;
  venueId: string;
  name: string;
  description: string | null;
  scheduledDate: Date;
  startTime: Date;
  endTime: Date;
  status: EventStatus;
  playlistConfig: PlaylistConfig;
  currentTrackId: string | null;
  settings: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  activatedAt: Date | null;
}

export interface PlaylistConfig {
  type: 'genre' | 'playlist' | 'custom';
  genres?: string[];
  playlistId?: string;
  trackIds?: string[];
  filters?: TrackFilters;
}

export interface TrackFilters {
  explicitAllowed?: boolean;
  minDuration?: number;
  maxDuration?: number;
  minPopularity?: number;
  energy?: [number, number];
  tempo?: [number, number];
  valence?: [number, number];
}

export interface Vote {
  id: string;
  eventId: string;
  trackId: string;
  sessionId: string;
  votedAt: Date;
}

export interface QueueItem {
  id: string;
  eventId: string;
  trackId: string;
  trackData: SpotifyTrack;
  voteCount: number;
  score: number;
  lastVotedAt: Date;
  addedAt: Date;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ id: string; name: string }>;
  album: {
    id: string;
    name: string;
    images: Array<{ url: string; width: number; height: number }>;
  };
  duration_ms: number;
  preview_url: string | null;
  explicit: boolean;
  popularity: number;
  uri: string;
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  venueId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subscription {
  id: string;
  venueId: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  createdAt: Date;
  updatedAt: Date;
}

// API DTOs
export interface CreateEventDto {
  name: string;
  description?: string;
  scheduledDate: Date;
  startTime: Date;
  endTime: Date;
  playlistConfig: PlaylistConfig;
}

export interface CreateVoteDto {
  eventId: string;
  trackId: string;
  sessionId: string;
}

export interface VoteResponse {
  success: boolean;
  queuePosition?: number;
  message?: string;
}

// WebSocket events
export interface WebSocketEvents {
  // Client to server
  joinEvent: { eventId: string };
  leaveEvent: { eventId: string };

  // Server to client
  voteUpdate: {
    eventId: string;
    trackId: string;
    voteCount: number;
    newPosition: number;
  };
  queueUpdate: {
    eventId: string;
    queue: QueueItem[];
  };
  nowPlayingUpdate: {
    eventId: string;
    track: SpotifyTrack | null;
  };
  eventStatusChange: {
    eventId: string;
    status: EventStatus;
  };
}

// API responses
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
