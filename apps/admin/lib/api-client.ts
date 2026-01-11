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

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
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
    const response = await this.request<{ access_token: string; venue: any }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    );
    this.setToken(response.access_token);
    return response;
  }

  async logout() {
    this.setToken(null);
  }

  async getCurrentVenue() {
    return this.request<any>('/auth/me');
  }

  // Venues
  async getVenue(id: string) {
    return this.request<any>(`/venues/${id}`);
  }

  async updateVenue(id: string, data: any) {
    return this.request<any>(`/venues/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Events
  async getEvents(venueId: string) {
    return this.request<any[]>(`/events/venue/${venueId}`);
  }

  async getEvent(id: string) {
    return this.request<any>(`/events/${id}`);
  }

  async createEvent(data: any) {
    return this.request<any>('/events', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEvent(id: string, data: any) {
    return this.request<any>(`/events/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteEvent(id: string) {
    return this.request<any>(`/events/${id}`, {
      method: 'DELETE',
    });
  }

  async activateEvent(id: string) {
    return this.request<any>(`/events/${id}/activate`, {
      method: 'POST',
    });
  }

  async endEvent(id: string) {
    return this.request<any>(`/events/${id}/end`, {
      method: 'POST',
    });
  }

  // Queue
  async getQueue(eventId: string) {
    return this.request<any[]>(`/queue/${eventId}`);
  }

  async removeFromQueue(eventId: string, trackId: string) {
    return this.request<any>(`/queue/${eventId}/${trackId}`, {
      method: 'DELETE',
    });
  }

  // Playback
  async initializePlayback(eventId: string, deviceId: string) {
    return this.request<any>(`/playback/${eventId}/initialize`, {
      method: 'POST',
      body: JSON.stringify({ deviceId }),
    });
  }

  async playNext(eventId: string) {
    return this.request<any>(`/playback/${eventId}/play-next`, {
      method: 'POST',
    });
  }

  async pause(eventId: string) {
    return this.request<any>(`/playback/${eventId}/pause`, {
      method: 'POST',
    });
  }

  async resume(eventId: string) {
    return this.request<any>(`/playback/${eventId}/resume`, {
      method: 'POST',
    });
  }

  async skip(eventId: string) {
    return this.request<any>(`/playback/${eventId}/skip`, {
      method: 'POST',
    });
  }

  async getPlaybackStatus(eventId: string) {
    return this.request<any>(`/playback/${eventId}/status`);
  }

  // Spotify
  async getSpotifyAuthUrl(venueId: string) {
    return this.request<{ authUrl: string; state: string }>(
      `/spotify/auth-url/${venueId}`
    );
  }

  async getSpotifyDevices(venueId: string) {
    return this.request<any[]>(`/spotify/${venueId}/devices`);
  }

  async searchTracks(venueId: string, query: string) {
    return this.request<any[]>(
      `/spotify/${venueId}/search?q=${encodeURIComponent(query)}`
    );
  }
}

export const apiClient = new ApiClient(API_URL);
export default apiClient;
