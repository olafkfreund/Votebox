import { Injectable, BadRequestException } from '@nestjs/common';
import { SpotifyAuthService } from './spotify-auth.service';
import axios, { AxiosInstance } from 'axios';

interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ id: string; name: string }>;
  album: {
    id: string;
    name: string;
    images: Array<{ url: string; height: number; width: number }>;
  };
  duration_ms: number;
  explicit: boolean;
  uri: string;
  preview_url: string | null;
}

interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  images: Array<{ url: string; height: number; width: number }>;
  tracks: {
    total: number;
  };
  owner: {
    id: string;
    display_name: string;
  };
}

interface SpotifySearchResponse {
  tracks: {
    items: SpotifyTrack[];
    total: number;
    limit: number;
    offset: number;
  };
}

interface SpotifyPlaylistTracksResponse {
  items: Array<{
    track: SpotifyTrack;
  }>;
  total: number;
  limit: number;
  offset: number;
}

@Injectable()
export class SpotifyApiService {
  private readonly baseUrl = 'https://api.spotify.com/v1';

  constructor(private readonly spotifyAuthService: SpotifyAuthService) {}

  /**
   * Create authenticated Spotify API client
   */
  private async getClient(venueId: string): Promise<AxiosInstance> {
    const accessToken = await this.spotifyAuthService.getValidAccessToken(venueId);

    return axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Search for tracks by query
   */
  async searchTracks(
    venueId: string,
    query: string,
    limit = 20,
    offset = 0,
  ): Promise<{ tracks: SpotifyTrack[]; total: number }> {
    try {
      const client = await this.getClient(venueId);

      const response = await client.get<SpotifySearchResponse>('/search', {
        params: {
          q: query,
          type: 'track',
          limit,
          offset,
        },
      });

      return {
        tracks: response.data.tracks.items,
        total: response.data.tracks.total,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new BadRequestException(
          `Spotify API error: ${error.response?.data?.error?.message || error.message}`,
        );
      }
      throw error;
    }
  }

  /**
   * Search tracks by genre
   */
  async searchTracksByGenre(
    venueId: string,
    genre: string,
    limit = 50,
  ): Promise<SpotifyTrack[]> {
    const result = await this.searchTracks(venueId, `genre:${genre}`, limit);
    return result.tracks;
  }

  /**
   * Get track by ID
   */
  async getTrack(venueId: string, trackId: string): Promise<SpotifyTrack> {
    try {
      const client = await this.getClient(venueId);

      const response = await client.get<SpotifyTrack>(`/tracks/${trackId}`);

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new BadRequestException(
          `Spotify API error: ${error.response?.data?.error?.message || error.message}`,
        );
      }
      throw error;
    }
  }

  /**
   * Get multiple tracks by IDs
   */
  async getTracks(venueId: string, trackIds: string[]): Promise<SpotifyTrack[]> {
    try {
      const client = await this.getClient(venueId);

      const response = await client.get<{ tracks: SpotifyTrack[] }>('/tracks', {
        params: {
          ids: trackIds.join(','),
        },
      });

      return response.data.tracks;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new BadRequestException(
          `Spotify API error: ${error.response?.data?.error?.message || error.message}`,
        );
      }
      throw error;
    }
  }

  /**
   * Get user's playlists
   */
  async getUserPlaylists(
    venueId: string,
    limit = 20,
    offset = 0,
  ): Promise<{ playlists: SpotifyPlaylist[]; total: number }> {
    try {
      const client = await this.getClient(venueId);

      const response = await client.get<{
        items: SpotifyPlaylist[];
        total: number;
      }>('/me/playlists', {
        params: { limit, offset },
      });

      return {
        playlists: response.data.items,
        total: response.data.total,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new BadRequestException(
          `Spotify API error: ${error.response?.data?.error?.message || error.message}`,
        );
      }
      throw error;
    }
  }

  /**
   * Get playlist details
   */
  async getPlaylist(venueId: string, playlistId: string): Promise<SpotifyPlaylist> {
    try {
      const client = await this.getClient(venueId);

      const response = await client.get<SpotifyPlaylist>(`/playlists/${playlistId}`);

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new BadRequestException(
          `Spotify API error: ${error.response?.data?.error?.message || error.message}`,
        );
      }
      throw error;
    }
  }

  /**
   * Get tracks from a playlist
   */
  async getPlaylistTracks(
    venueId: string,
    playlistId: string,
    limit = 100,
    offset = 0,
  ): Promise<{ tracks: SpotifyTrack[]; total: number }> {
    try {
      const client = await this.getClient(venueId);

      const response = await client.get<SpotifyPlaylistTracksResponse>(
        `/playlists/${playlistId}/tracks`,
        {
          params: { limit, offset },
        },
      );

      return {
        tracks: response.data.items.map((item) => item.track),
        total: response.data.total,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new BadRequestException(
          `Spotify API error: ${error.response?.data?.error?.message || error.message}`,
        );
      }
      throw error;
    }
  }

  /**
   * Get available genres
   */
  async getAvailableGenreSeeds(venueId: string): Promise<string[]> {
    try {
      const client = await this.getClient(venueId);

      const response = await client.get<{ genres: string[] }>(
        '/recommendations/available-genre-seeds',
      );

      return response.data.genres;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new BadRequestException(
          `Spotify API error: ${error.response?.data?.error?.message || error.message}`,
        );
      }
      throw error;
    }
  }

  /**
   * Get track recommendations based on seed genres, artists, or tracks
   */
  async getRecommendations(
    venueId: string,
    params: {
      seedGenres?: string[];
      seedArtists?: string[];
      seedTracks?: string[];
      limit?: number;
    },
  ): Promise<SpotifyTrack[]> {
    try {
      const client = await this.getClient(venueId);

      const queryParams: any = {
        limit: params.limit || 20,
      };

      if (params.seedGenres && params.seedGenres.length > 0) {
        queryParams.seed_genres = params.seedGenres.join(',');
      }
      if (params.seedArtists && params.seedArtists.length > 0) {
        queryParams.seed_artists = params.seedArtists.join(',');
      }
      if (params.seedTracks && params.seedTracks.length > 0) {
        queryParams.seed_tracks = params.seedTracks.join(',');
      }

      const response = await client.get<{ tracks: SpotifyTrack[] }>(
        '/recommendations',
        { params: queryParams },
      );

      return response.data.tracks;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new BadRequestException(
          `Spotify API error: ${error.response?.data?.error?.message || error.message}`,
        );
      }
      throw error;
    }
  }

  /**
   * Get user's currently playing track
   */
  async getCurrentlyPlaying(venueId: string): Promise<SpotifyTrack | null> {
    try {
      const client = await this.getClient(venueId);

      const response = await client.get<{ item: SpotifyTrack }>(
        '/me/player/currently-playing',
      );

      return response.data?.item || null;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // 204 No Content means nothing is currently playing
        if (error.response?.status === 204) {
          return null;
        }
        throw new BadRequestException(
          `Spotify API error: ${error.response?.data?.error?.message || error.message}`,
        );
      }
      throw error;
    }
  }

  /**
   * Play a track on Spotify
   */
  async playTrack(venueId: string, trackUri: string, deviceId?: string): Promise<void> {
    try {
      const client = await this.getClient(venueId);

      const params = deviceId ? { device_id: deviceId } : {};

      await client.put(
        '/me/player/play',
        {
          uris: [trackUri],
        },
        { params },
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new BadRequestException(
          `Spotify API error: ${error.response?.data?.error?.message || error.message}`,
        );
      }
      throw error;
    }
  }

  /**
   * Pause playback
   */
  async pausePlayback(venueId: string, deviceId?: string): Promise<void> {
    try {
      const client = await this.getClient(venueId);

      const params = deviceId ? { device_id: deviceId } : {};

      await client.put('/me/player/pause', {}, { params });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new BadRequestException(
          `Spotify API error: ${error.response?.data?.error?.message || error.message}`,
        );
      }
      throw error;
    }
  }

  /**
   * Get available devices
   */
  async getDevices(venueId: string): Promise<any[]> {
    try {
      const client = await this.getClient(venueId);

      const response = await client.get<{ devices: any[] }>('/me/player/devices');

      return response.data.devices;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new BadRequestException(
          `Spotify API error: ${error.response?.data?.error?.message || error.message}`,
        );
      }
      throw error;
    }
  }
}
