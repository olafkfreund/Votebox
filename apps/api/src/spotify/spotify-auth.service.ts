import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';
import * as crypto from 'crypto';

interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

interface SpotifyUserProfile {
  id: string;
  display_name: string;
  email: string;
}

@Injectable()
export class SpotifyAuthService {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  private readonly scopes = [
    'user-read-email',
    'user-read-private',
    'playlist-read-private',
    'playlist-read-collaborative',
    'user-modify-playback-state',
    'user-read-playback-state',
    'user-read-currently-playing',
  ];

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.clientId = this.configService.get<string>('SPOTIFY_CLIENT_ID') || '';
    this.clientSecret = this.configService.get<string>('SPOTIFY_CLIENT_SECRET') || '';
    this.redirectUri = this.configService.get<string>('SPOTIFY_REDIRECT_URI') ||
      'http://localhost:4000/api/v1/spotify/callback';
  }

  /**
   * Generate authorization URL for Spotify OAuth flow
   */
  getAuthorizationUrl(venueId: string): { authUrl: string; state: string } {
    // Generate random state for CSRF protection
    const state = crypto.randomBytes(16).toString('hex');

    // Store state temporarily (in production, use Redis)
    // For now, we'll encode venueId in the state
    const stateWithVenue = `${state}:${venueId}`;

    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: this.redirectUri,
      scope: this.scopes.join(' '),
      state: Buffer.from(stateWithVenue).toString('base64'),
    });

    const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;

    return { authUrl, state };
  }

  /**
   * Handle OAuth callback and exchange code for tokens
   */
  async handleCallback(code: string, state: string) {
    // Decode state to get venueId
    const decodedState = Buffer.from(state, 'base64').toString('utf-8');
    const [stateToken, venueId] = decodedState.split(':');

    if (!venueId) {
      throw new BadRequestException('Invalid state parameter');
    }

    // Verify venue exists
    const venue = await this.prisma.venue.findUnique({
      where: { id: venueId },
    });

    if (!venue) {
      throw new NotFoundException(`Venue with ID ${venueId} not found`);
    }

    // Exchange authorization code for tokens
    const tokens = await this.exchangeCodeForTokens(code);

    // Get Spotify user profile
    const profile = await this.getSpotifyProfile(tokens.access_token);

    // Calculate token expiry
    const tokenExpiry = new Date(Date.now() + tokens.expires_in * 1000);

    // Update venue with Spotify credentials
    const updatedVenue = await this.prisma.venue.update({
      where: { id: venueId },
      data: {
        spotifyAccountId: profile.id,
        spotifyAccessToken: tokens.access_token,
        spotifyRefreshToken: tokens.refresh_token,
        spotifyTokenExpiry: tokenExpiry,
      },
      select: {
        id: true,
        name: true,
        spotifyAccountId: true,
      },
    });

    return {
      success: true,
      message: 'Spotify account connected successfully',
      venueId: updatedVenue.id,
      spotifyAccountId: updatedVenue.spotifyAccountId,
    };
  }

  /**
   * Exchange authorization code for access and refresh tokens
   */
  private async exchangeCodeForTokens(code: string): Promise<SpotifyTokenResponse> {
    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

    try {
      const response = await axios.post<SpotifyTokenResponse>(
        'https://accounts.spotify.com/api/token',
        new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: this.redirectUri,
        }),
        {
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new BadRequestException(
          `Failed to exchange code for tokens: ${error.response?.data?.error_description || error.message}`,
        );
      }
      throw error;
    }
  }

  /**
   * Get Spotify user profile
   */
  private async getSpotifyProfile(accessToken: string): Promise<SpotifyUserProfile> {
    try {
      const response = await axios.get<SpotifyUserProfile>(
        'https://api.spotify.com/v1/me',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        },
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new UnauthorizedException(
          `Failed to get Spotify profile: ${error.response?.data?.error?.message || error.message}`,
        );
      }
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(venueId: string): Promise<string> {
    const venue = await this.prisma.venue.findUnique({
      where: { id: venueId },
      select: {
        id: true,
        spotifyRefreshToken: true,
        spotifyAccountId: true,
      },
    });

    if (!venue) {
      throw new NotFoundException(`Venue with ID ${venueId} not found`);
    }

    if (!venue.spotifyRefreshToken) {
      throw new BadRequestException('Venue does not have a Spotify refresh token');
    }

    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

    try {
      const response = await axios.post<SpotifyTokenResponse>(
        'https://accounts.spotify.com/api/token',
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: venue.spotifyRefreshToken,
        }),
        {
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      const { access_token, expires_in, refresh_token } = response.data;
      const tokenExpiry = new Date(Date.now() + expires_in * 1000);

      // Update venue with new tokens
      await this.prisma.venue.update({
        where: { id: venueId },
        data: {
          spotifyAccessToken: access_token,
          spotifyRefreshToken: refresh_token || venue.spotifyRefreshToken,
          spotifyTokenExpiry: tokenExpiry,
        },
      });

      return access_token;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new UnauthorizedException(
          `Failed to refresh token: ${error.response?.data?.error_description || error.message}`,
        );
      }
      throw error;
    }
  }

  /**
   * Get valid access token (refresh if needed)
   */
  async getValidAccessToken(venueId: string): Promise<string> {
    const venue = await this.prisma.venue.findUnique({
      where: { id: venueId },
      select: {
        spotifyAccessToken: true,
        spotifyRefreshToken: true,
        spotifyTokenExpiry: true,
      },
    });

    if (!venue) {
      throw new NotFoundException(`Venue with ID ${venueId} not found`);
    }

    if (!venue.spotifyAccessToken || !venue.spotifyRefreshToken) {
      throw new BadRequestException('Venue Spotify account not connected');
    }

    // Check if token is expired or will expire in the next 5 minutes
    const now = new Date();
    const expiryBuffer = new Date(now.getTime() + 5 * 60 * 1000);

    if (!venue.spotifyTokenExpiry || venue.spotifyTokenExpiry <= expiryBuffer) {
      // Token expired or will expire soon, refresh it
      return this.refreshAccessToken(venueId);
    }

    return venue.spotifyAccessToken;
  }

  /**
   * Disconnect Spotify account from venue
   */
  async disconnect(venueId: string) {
    const venue = await this.prisma.venue.findUnique({
      where: { id: venueId },
    });

    if (!venue) {
      throw new NotFoundException(`Venue with ID ${venueId} not found`);
    }

    if (!venue.spotifyAccountId) {
      throw new BadRequestException('Venue does not have a connected Spotify account');
    }

    await this.prisma.venue.update({
      where: { id: venueId },
      data: {
        spotifyAccountId: null,
        spotifyAccessToken: null,
        spotifyRefreshToken: null,
        spotifyTokenExpiry: null,
      },
    });

    return {
      success: true,
      message: 'Spotify account disconnected successfully',
    };
  }

  /**
   * Get Spotify connection status for venue
   */
  async getStatus(venueId: string) {
    const venue = await this.prisma.venue.findUnique({
      where: { id: venueId },
      select: {
        spotifyAccountId: true,
        spotifyTokenExpiry: true,
      },
    });

    if (!venue) {
      throw new NotFoundException(`Venue with ID ${venueId} not found`);
    }

    const connected = !!venue.spotifyAccountId;
    const now = new Date();
    const needsRefresh = venue.spotifyTokenExpiry
      ? venue.spotifyTokenExpiry <= now
      : false;

    return {
      connected,
      spotifyAccountId: venue.spotifyAccountId,
      tokenExpiry: venue.spotifyTokenExpiry,
      needsRefresh,
    };
  }
}
