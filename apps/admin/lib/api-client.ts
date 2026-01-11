/**
 * API Client for Admin Dashboard
 * Handles authenticated requests to the backend API
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

export interface Venue {
  id: string;
  name: string;
  slug: string;
  email: string;
  spotifyAccountId: string | null;
  settings: Record<string, unknown>;
}

export interface Event {
  id: string;
  venueId: string;
  name: string;
  description: string | null;
  status: 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'ENDED';
  scheduledStart: string | null;
  scheduledEnd: string | null;
  actualStart: string | null;
  actualEnd: string | null;
  playlistSource: string;
  playlistConfig: {
    genres?: string[];
    excludeExplicit?: boolean;
    playlistIds?: string[];
    [key: string]: unknown;
  };
  votingRules: {
    votesPerHour?: number;
    cooldownMinutes?: number;
    maxQueueSize?: number;
    [key: string]: unknown;
  };
  recurrence: string;
  createdAt: string;
  updatedAt: string;
}

export interface QueueItem {
  id: string;
  eventId: string;
  trackId: string;
  trackName: string;
  artistName: string;
  albumArt: string;
  duration: number;
  voteCount: number;
  position: number;
  score: number;
  addedAt: string;
  lastVotedAt: string | null;
}

export interface PlaybackStatus {
  eventId: string;
  initialized: boolean;
  isPlaying: boolean;
  autoPlayEnabled: boolean;
  deviceId?: string | null;
  currentTrack?: {
    trackId: string;
    trackName: string;
    artistName: string;
    albumArt: string;
    duration: number;
    progress?: number;
    elapsed?: number;
    remaining?: number;
  } | null;
  queueSize?: number;
}

export interface SpotifyDevice {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
  volume_percent: number;
}

export interface Track {
  id: string;
  name: string;
  artist: string;
  album: string;
  albumArt: string;
  duration: number;
  uri: string;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    // Load token from localStorage if available
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token);
      } else {
        localStorage.removeItem('auth_token');
      }
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        message: response.statusText,
        statusCode: response.status,
      }));
      throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // Authentication
  async login(email: string, password: string) {
    const response = await this.request<{ access_token: string; venue: Venue }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(response.access_token);
    return response;
  }

  async logout() {
    this.setToken(null);
  }

  async getCurrentVenue() {
    return this.request<Venue>('/auth/me');
  }

  // Venues
  async getVenue(id: string) {
    return this.request<Venue>(`/venues/${id}`);
  }

  async updateVenue(id: string, data: Partial<Venue>) {
    return this.request<Venue>(`/venues/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Events
  async getEvents(venueId: string) {
    return this.request<Event[]>(`/events/venue/${venueId}`);
  }

  async getEvent(id: string) {
    return this.request<Event>(`/events/${id}`);
  }

  async createEvent(data: Partial<Event>) {
    return this.request<Event>('/events', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEvent(id: string, data: Partial<Event>) {
    return this.request<Event>(`/events/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteEvent(id: string) {
    return this.request<{ message: string }>(`/events/${id}`, {
      method: 'DELETE',
    });
  }

  async activateEvent(id: string) {
    return this.request<Event>(`/events/${id}/activate`, {
      method: 'POST',
    });
  }

  async endEvent(id: string) {
    return this.request<Event>(`/events/${id}/end`, {
      method: 'POST',
    });
  }

  // Queue
  async getQueue(eventId: string) {
    return this.request<QueueItem[]>(`/queue/${eventId}`);
  }

  async removeFromQueue(eventId: string, trackId: string) {
    return this.request<{ message: string }>(`/queue/${eventId}/${trackId}`, {
      method: 'DELETE',
    });
  }

  // Playback
  async initializePlayback(eventId: string, deviceId: string) {
    return this.request<{ message: string }>(`/playback/${eventId}/initialize`, {
      method: 'POST',
      body: JSON.stringify({ deviceId }),
    });
  }

  async playNext(eventId: string) {
    return this.request<{ message: string; nowPlaying: unknown }>(
      `/playback/${eventId}/play-next`,
      {
        method: 'POST',
      }
    );
  }

  async pause(eventId: string) {
    return this.request<{ message: string }>(`/playback/${eventId}/pause`, {
      method: 'POST',
    });
  }

  async resume(eventId: string) {
    return this.request<{ message: string }>(`/playback/${eventId}/resume`, {
      method: 'POST',
    });
  }

  async skip(eventId: string) {
    return this.request<{ message: string }>(`/playback/${eventId}/skip`, {
      method: 'POST',
    });
  }

  async getPlaybackStatus(eventId: string) {
    return this.request<PlaybackStatus>(`/playback/${eventId}/status`);
  }

  // Spotify
  async getSpotifyAuthUrl(venueId: string) {
    return this.request<{ authUrl: string; state: string }>(`/spotify/auth-url/${venueId}`);
  }

  async getSpotifyDevices(venueId: string) {
    return this.request<SpotifyDevice[]>(`/spotify/${venueId}/devices`);
  }

  async searchTracks(venueId: string, query: string) {
    return this.request<Track[]>(`/spotify/${venueId}/search?q=${encodeURIComponent(query)}`);
  }
}

export const apiClient = new ApiClient(API_URL);
export default apiClient;
