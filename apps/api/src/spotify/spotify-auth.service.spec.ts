import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { SpotifyAuthService } from './spotify-auth.service';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('SpotifyAuthService', () => {
  let service: SpotifyAuthService;
  let _prismaService: PrismaService;
  let _configService: ConfigService;

  const mockPrismaService = {
    venue: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        SPOTIFY_CLIENT_ID: 'test_client_id',
        SPOTIFY_CLIENT_SECRET: 'test_client_secret',
        SPOTIFY_REDIRECT_URI: 'http://localhost:4000/api/v1/spotify/callback',
      };
      return config[key];
    }),
  };

  const mockVenue = {
    id: 'venue-123',
    name: 'Test Venue',
    slug: 'test-venue',
    email: 'test@venue.com',
    spotifyAccountId: null,
    spotifyAccessToken: null,
    spotifyRefreshToken: null,
    spotifyTokenExpiry: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpotifyAuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<SpotifyAuthService>(SpotifyAuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAuthorizationUrl', () => {
    it('should generate authorization URL with state', () => {
      const result = service.getAuthorizationUrl('venue-123');

      expect(result.authUrl).toContain('https://accounts.spotify.com/authorize');
      expect(result.authUrl).toContain('client_id=test_client_id');
      expect(result.authUrl).toContain('response_type=code');
      expect(result.authUrl).toContain('redirect_uri=');
      expect(result.state).toBeDefined();
      expect(result.state.length).toBeGreaterThan(0);
    });

    it('should include required scopes in authorization URL', () => {
      const result = service.getAuthorizationUrl('venue-123');

      expect(result.authUrl).toContain('scope=');
      expect(result.authUrl).toContain('user-read-email');
      expect(result.authUrl).toContain('playlist-read-private');
      expect(result.authUrl).toContain('user-modify-playback-state');
    });
  });

  describe('handleCallback', () => {
    const mockTokenResponse = {
      access_token: 'mock_access_token',
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: 'mock_refresh_token',
      scope: 'user-read-email',
    };

    const mockProfileResponse = {
      id: 'spotify_user_123',
      display_name: 'Test User',
      email: 'test@spotify.com',
    };

    it('should successfully handle OAuth callback', async () => {
      const state = Buffer.from('state123:venue-123').toString('base64');

      mockPrismaService.venue.findUnique.mockResolvedValue(mockVenue);

      mockedAxios.post.mockResolvedValueOnce({
        data: mockTokenResponse,
      });

      mockedAxios.get.mockResolvedValueOnce({
        data: mockProfileResponse,
      });

      mockPrismaService.venue.update.mockResolvedValue({
        ...mockVenue,
        spotifyAccountId: mockProfileResponse.id,
      });

      const result = await service.handleCallback('auth_code_123', state);

      expect(result.success).toBe(true);
      expect(result.spotifyAccountId).toBe(mockProfileResponse.id);
      expect(mockPrismaService.venue.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'venue-123' },
          data: expect.objectContaining({
            spotifyAccountId: mockProfileResponse.id,
            spotifyAccessToken: mockTokenResponse.access_token,
            spotifyRefreshToken: mockTokenResponse.refresh_token,
          }),
        })
      );
    });

    it('should throw BadRequestException for invalid state', async () => {
      const invalidState = Buffer.from('invalid').toString('base64');

      await expect(service.handleCallback('code', invalidState)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw NotFoundException if venue not found', async () => {
      const state = Buffer.from('state123:venue-999').toString('base64');
      mockPrismaService.venue.findUnique.mockResolvedValue(null);

      await expect(service.handleCallback('code', state)).rejects.toThrow(NotFoundException);
    });

    it('should handle token exchange failure', async () => {
      const state = Buffer.from('state123:venue-123').toString('base64');
      mockPrismaService.venue.findUnique.mockResolvedValue(mockVenue);

      mockedAxios.post.mockRejectedValueOnce({
        isAxiosError: true,
        response: {
          data: {
            error_description: 'Invalid authorization code',
          },
        },
      });

      await expect(service.handleCallback('invalid_code', state)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('refreshAccessToken', () => {
    const mockTokenResponse = {
      access_token: 'new_access_token',
      token_type: 'Bearer',
      expires_in: 3600,
      scope: 'user-read-email',
    };

    it('should refresh access token successfully', async () => {
      mockPrismaService.venue.findUnique.mockResolvedValue({
        ...mockVenue,
        spotifyRefreshToken: 'refresh_token_123',
        spotifyAccountId: 'spotify_user_123',
      });

      mockedAxios.post.mockResolvedValueOnce({
        data: mockTokenResponse,
      });

      mockPrismaService.venue.update.mockResolvedValue(mockVenue);

      const result = await service.refreshAccessToken('venue-123');

      expect(result).toBe(mockTokenResponse.access_token);
      expect(mockPrismaService.venue.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'venue-123' },
          data: expect.objectContaining({
            spotifyAccessToken: mockTokenResponse.access_token,
          }),
        })
      );
    });

    it('should throw NotFoundException if venue not found', async () => {
      mockPrismaService.venue.findUnique.mockResolvedValue(null);

      await expect(service.refreshAccessToken('venue-999')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if no refresh token', async () => {
      mockPrismaService.venue.findUnique.mockResolvedValue({
        ...mockVenue,
        spotifyRefreshToken: null,
      });

      await expect(service.refreshAccessToken('venue-123')).rejects.toThrow(BadRequestException);
    });

    it('should handle refresh token failure', async () => {
      mockPrismaService.venue.findUnique.mockResolvedValue({
        ...mockVenue,
        spotifyRefreshToken: 'invalid_refresh_token',
      });

      mockedAxios.post.mockRejectedValueOnce({
        isAxiosError: true,
        response: {
          data: {
            error_description: 'Invalid refresh token',
          },
        },
      });

      await expect(service.refreshAccessToken('venue-123')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getValidAccessToken', () => {
    it('should return existing token if not expired', async () => {
      const futureExpiry = new Date(Date.now() + 3600 * 1000);

      mockPrismaService.venue.findUnique.mockResolvedValue({
        ...mockVenue,
        spotifyAccessToken: 'valid_token',
        spotifyRefreshToken: 'refresh_token',
        spotifyTokenExpiry: futureExpiry,
      });

      const result = await service.getValidAccessToken('venue-123');

      expect(result).toBe('valid_token');
      expect(mockPrismaService.venue.update).not.toHaveBeenCalled();
    });

    it('should refresh token if expired', async () => {
      const pastExpiry = new Date(Date.now() - 1000);

      mockPrismaService.venue.findUnique.mockResolvedValueOnce({
        ...mockVenue,
        spotifyAccessToken: 'expired_token',
        spotifyRefreshToken: 'refresh_token',
        spotifyTokenExpiry: pastExpiry,
      });

      mockPrismaService.venue.findUnique.mockResolvedValueOnce({
        ...mockVenue,
        spotifyRefreshToken: 'refresh_token',
        spotifyAccountId: 'spotify_user_123',
      });

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          access_token: 'new_token',
          expires_in: 3600,
        },
      });

      mockPrismaService.venue.update.mockResolvedValue(mockVenue);

      const result = await service.getValidAccessToken('venue-123');

      expect(result).toBe('new_token');
    });

    it('should throw BadRequestException if no Spotify connection', async () => {
      mockPrismaService.venue.findUnique.mockResolvedValue({
        ...mockVenue,
        spotifyAccessToken: null,
        spotifyRefreshToken: null,
      });

      await expect(service.getValidAccessToken('venue-123')).rejects.toThrow(BadRequestException);
    });
  });

  describe('disconnect', () => {
    it('should disconnect Spotify account successfully', async () => {
      mockPrismaService.venue.findUnique.mockResolvedValue({
        ...mockVenue,
        spotifyAccountId: 'spotify_user_123',
      });

      mockPrismaService.venue.update.mockResolvedValue(mockVenue);

      const result = await service.disconnect('venue-123');

      expect(result.success).toBe(true);
      expect(mockPrismaService.venue.update).toHaveBeenCalledWith({
        where: { id: 'venue-123' },
        data: {
          spotifyAccountId: null,
          spotifyAccessToken: null,
          spotifyRefreshToken: null,
          spotifyTokenExpiry: null,
        },
      });
    });

    it('should throw BadRequestException if no Spotify connection', async () => {
      mockPrismaService.venue.findUnique.mockResolvedValue({
        ...mockVenue,
        spotifyAccountId: null,
      });

      await expect(service.disconnect('venue-123')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if venue not found', async () => {
      mockPrismaService.venue.findUnique.mockResolvedValue(null);

      await expect(service.disconnect('venue-999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getStatus', () => {
    it('should return connected status with account info', async () => {
      const futureExpiry = new Date(Date.now() + 3600 * 1000);

      mockPrismaService.venue.findUnique.mockResolvedValue({
        ...mockVenue,
        spotifyAccountId: 'spotify_user_123',
        spotifyTokenExpiry: futureExpiry,
      });

      const result = await service.getStatus('venue-123');

      expect(result.connected).toBe(true);
      expect(result.spotifyAccountId).toBe('spotify_user_123');
      expect(result.needsRefresh).toBe(false);
    });

    it('should return disconnected status', async () => {
      mockPrismaService.venue.findUnique.mockResolvedValue(mockVenue);

      const result = await service.getStatus('venue-123');

      expect(result.connected).toBe(false);
      expect(result.spotifyAccountId).toBeUndefined();
    });

    it('should indicate token needs refresh if expired', async () => {
      const pastExpiry = new Date(Date.now() - 1000);

      mockPrismaService.venue.findUnique.mockResolvedValue({
        ...mockVenue,
        spotifyAccountId: 'spotify_user_123',
        spotifyTokenExpiry: pastExpiry,
      });

      const result = await service.getStatus('venue-123');

      expect(result.connected).toBe(true);
      expect(result.needsRefresh).toBe(true);
    });

    it('should throw NotFoundException if venue not found', async () => {
      mockPrismaService.venue.findUnique.mockResolvedValue(null);

      await expect(service.getStatus('venue-999')).rejects.toThrow(NotFoundException);
    });
  });
});
