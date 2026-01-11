import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PlaybackService } from './playback.service';
import { PrismaService } from '../prisma/prisma.service';
import { SpotifyApiService } from '../spotify/spotify-api.service';
import { QueueService } from '../queue/queue.service';
import { WebSocketGatewayService } from '../websocket/websocket.gateway';

describe('PlaybackService', () => {
  let service: PlaybackService;
  let _prismaService: PrismaService;
  let _spotifyApi: SpotifyApiService;
  let _queueService: QueueService;
  let _websocket: WebSocketGatewayService;

  const mockPrismaService = {
    event: {
      findUnique: jest.fn(),
    },
    queueItem: {
      findFirst: jest.fn(),
    },
  };

  const mockSpotifyApi = {
    getDevices: jest.fn(),
    playTrack: jest.fn(),
    pausePlayback: jest.fn(),
  };

  const mockQueueService = {
    getNextTrack: jest.fn(),
    markAsPlayed: jest.fn(),
  };

  const mockWebSocket = {
    emitNowPlayingUpdate: jest.fn(),
    emitQueueUpdate: jest.fn(),
  };

  const mockEvent = {
    id: 'event-123',
    venueId: 'venue-123',
    name: 'Doom Rock Night',
    status: 'ACTIVE',
    venue: {
      id: 'venue-123',
      name: 'The Metal Tavern',
    },
  };

  const mockDevice = {
    id: 'device-123',
    name: 'Venue Sound System',
    type: 'Computer',
    is_active: false,
  };

  const mockQueueItem = {
    id: 'queue-123',
    eventId: 'event-123',
    trackId: 'track-123',
    trackUri: 'spotify:track:track-123',
    trackName: 'Dopesmoker',
    artistName: 'Sleep',
    albumName: 'Dopesmoker',
    albumArt: 'https://example.com/art.jpg',
    duration: 3841000,
    position: 1,
    score: 50,
    voteCount: 3,
    isPlayed: false,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlaybackService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: SpotifyApiService,
          useValue: mockSpotifyApi,
        },
        {
          provide: QueueService,
          useValue: mockQueueService,
        },
        {
          provide: WebSocketGatewayService,
          useValue: mockWebSocket,
        },
      ],
    }).compile();

    service = module.get<PlaybackService>(PlaybackService);
    prismaService = module.get<PrismaService>(PrismaService);
    spotifyApi = module.get<SpotifyApiService>(SpotifyApiService);
    queueService = module.get<QueueService>(QueueService);
    websocket = module.get<WebSocketGatewayService>(WebSocketGatewayService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initializePlayback', () => {
    it('should initialize playback with valid device', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockSpotifyApi.getDevices.mockResolvedValue([mockDevice]);

      const result = await service.initializePlayback('event-123', 'device-123');

      expect(mockPrismaService.event.findUnique).toHaveBeenCalledWith({
        where: { id: 'event-123' },
        include: { venue: true },
      });
      expect(mockSpotifyApi.getDevices).toHaveBeenCalledWith('venue-123');
      expect(result).toEqual({
        message: 'Playback initialized successfully',
        deviceId: 'device-123',
      });
    });

    it('should throw NotFoundException if event not found', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(null);

      await expect(service.initializePlayback('event-999', 'device-123')).rejects.toThrow(
        new NotFoundException('Event with ID event-999 not found')
      );
    });

    it('should throw BadRequestException if event not active', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({
        ...mockEvent,
        status: 'ENDED',
      });

      await expect(service.initializePlayback('event-123', 'device-123')).rejects.toThrow(
        new BadRequestException('Event must be active to enable playback')
      );
    });

    it('should throw NotFoundException if device not found', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockSpotifyApi.getDevices.mockResolvedValue([]);

      await expect(service.initializePlayback('event-123', 'device-999')).rejects.toThrow(
        new NotFoundException('Spotify device with ID device-999 not found')
      );
    });
  });

  describe('playNext', () => {
    beforeEach(async () => {
      // Initialize playback first
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockSpotifyApi.getDevices.mockResolvedValue([mockDevice]);
      await service.initializePlayback('event-123', 'device-123');
    });

    it('should play next track from queue', async () => {
      mockQueueService.getNextTrack.mockResolvedValue(mockQueueItem);
      mockSpotifyApi.playTrack.mockResolvedValue(undefined);
      mockQueueService.markAsPlayed.mockResolvedValue(mockQueueItem);

      const result = await service.playNext('event-123');

      expect(mockQueueService.getNextTrack).toHaveBeenCalledWith('event-123');
      expect(mockSpotifyApi.playTrack).toHaveBeenCalledWith(
        'venue-123',
        'spotify:track:track-123',
        'device-123'
      );
      expect(mockQueueService.markAsPlayed).toHaveBeenCalledWith('event-123', 'track-123');
      expect(mockWebSocket.emitNowPlayingUpdate).toHaveBeenCalled();
      expect(result.message).toBe('Track started playing');
      expect(result.nowPlaying).toBeDefined();
    });

    it('should handle empty queue', async () => {
      mockQueueService.getNextTrack.mockResolvedValue(null);

      const result = await service.playNext('event-123');

      expect(result.message).toBe('Queue is empty');
      expect(result.nowPlaying).toBeNull();
      expect(mockWebSocket.emitNowPlayingUpdate).toHaveBeenCalledWith('event-123', null);
    });

    it('should throw BadRequestException if playback not initialized', async () => {
      await expect(service.playNext('event-999')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException on Spotify error', async () => {
      mockQueueService.getNextTrack.mockResolvedValue(mockQueueItem);
      mockSpotifyApi.playTrack.mockRejectedValue(new Error('Spotify API error'));

      await expect(service.playNext('event-123')).rejects.toThrow(BadRequestException);
    });
  });

  describe('pause', () => {
    beforeEach(async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockSpotifyApi.getDevices.mockResolvedValue([mockDevice]);
      await service.initializePlayback('event-123', 'device-123');

      // Start playback
      mockQueueService.getNextTrack.mockResolvedValue(mockQueueItem);
      mockSpotifyApi.playTrack.mockResolvedValue(undefined);
      mockQueueService.markAsPlayed.mockResolvedValue(mockQueueItem);
      await service.playNext('event-123');
    });

    it('should pause active playback', async () => {
      mockSpotifyApi.pausePlayback.mockResolvedValue(undefined);

      const result = await service.pause('event-123');

      expect(mockSpotifyApi.pausePlayback).toHaveBeenCalledWith('venue-123', 'device-123');
      expect(result.message).toBe('Playback paused');
    });

    it('should throw BadRequestException if already paused', async () => {
      mockSpotifyApi.pausePlayback.mockResolvedValue(undefined);
      await service.pause('event-123');

      await expect(service.pause('event-123')).rejects.toThrow(
        new BadRequestException('Playback is already paused')
      );
    });
  });

  describe('resume', () => {
    beforeEach(async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockSpotifyApi.getDevices.mockResolvedValue([mockDevice]);
      await service.initializePlayback('event-123', 'device-123');

      // Start and pause playback
      mockQueueService.getNextTrack.mockResolvedValue(mockQueueItem);
      mockSpotifyApi.playTrack.mockResolvedValue(undefined);
      mockQueueService.markAsPlayed.mockResolvedValue(mockQueueItem);
      await service.playNext('event-123');

      mockSpotifyApi.pausePlayback.mockResolvedValue(undefined);
      await service.pause('event-123');
    });

    it('should resume paused playback', async () => {
      mockPrismaService.queueItem.findFirst.mockResolvedValue(mockQueueItem);
      mockSpotifyApi.playTrack.mockResolvedValue(undefined);

      const result = await service.resume('event-123');

      expect(mockSpotifyApi.playTrack).toHaveBeenCalled();
      expect(result.message).toBe('Playback resumed');
    });

    it('should throw BadRequestException if already playing', async () => {
      mockPrismaService.queueItem.findFirst.mockResolvedValue(mockQueueItem);
      mockSpotifyApi.playTrack.mockResolvedValue(undefined);
      await service.resume('event-123');

      await expect(service.resume('event-123')).rejects.toThrow(
        new BadRequestException('Playback is already active')
      );
    });
  });

  describe('skip', () => {
    beforeEach(async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockSpotifyApi.getDevices.mockResolvedValue([mockDevice]);
      await service.initializePlayback('event-123', 'device-123');

      // Start playback
      mockQueueService.getNextTrack.mockResolvedValue(mockQueueItem);
      mockSpotifyApi.playTrack.mockResolvedValue(undefined);
      mockQueueService.markAsPlayed.mockResolvedValue(mockQueueItem);
      await service.playNext('event-123');
    });

    it('should skip to next track', async () => {
      const nextTrack = { ...mockQueueItem, id: 'queue-456', trackId: 'track-456' };
      mockQueueService.getNextTrack.mockResolvedValue(nextTrack);
      mockQueueService.markAsPlayed.mockResolvedValue(nextTrack);

      const result = await service.skip('event-123');

      expect(result.message).toBe('Track started playing');
      expect(result.nowPlaying.trackId).toBe('track-456');
    });
  });

  describe('setAutoPlay', () => {
    beforeEach(async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockSpotifyApi.getDevices.mockResolvedValue([mockDevice]);
      await service.initializePlayback('event-123', 'device-123');
    });

    it('should enable auto-play', async () => {
      const result = await service.setAutoPlay('event-123', true);

      expect(result.message).toBe('Auto-play enabled');
      expect(result.autoPlayEnabled).toBe(true);
    });

    it('should disable auto-play', async () => {
      const result = await service.setAutoPlay('event-123', false);

      expect(result.message).toBe('Auto-play disabled');
      expect(result.autoPlayEnabled).toBe(false);
    });
  });

  describe('getStatus', () => {
    it('should return uninitialized status', async () => {
      const status = await service.getStatus('event-123');

      expect(status.initialized).toBe(false);
      expect(status.isPlaying).toBe(false);
    });

    it('should return initialized status with playing track', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockSpotifyApi.getDevices.mockResolvedValue([mockDevice]);
      await service.initializePlayback('event-123', 'device-123');

      mockQueueService.getNextTrack.mockResolvedValue(mockQueueItem);
      mockSpotifyApi.playTrack.mockResolvedValue(undefined);
      mockQueueService.markAsPlayed.mockResolvedValue(mockQueueItem);
      await service.playNext('event-123');

      mockPrismaService.queueItem.findFirst.mockResolvedValue(mockQueueItem);

      const status = await service.getStatus('event-123');

      expect(status.initialized).toBe(true);
      expect(status.isPlaying).toBe(true);
      expect(status.currentTrack).toBeDefined();
      expect(status.currentTrack.trackId).toBe('track-123');
      expect(status.deviceId).toBe('device-123');
      expect(status.autoPlayEnabled).toBe(true);
    });
  });

  describe('stop', () => {
    beforeEach(async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockSpotifyApi.getDevices.mockResolvedValue([mockDevice]);
      await service.initializePlayback('event-123', 'device-123');
    });

    it('should stop playback and cleanup state', async () => {
      mockSpotifyApi.pausePlayback.mockResolvedValue(undefined);

      const result = await service.stop('event-123');

      expect(result.message).toBe('Playback stopped');
      expect(mockWebSocket.emitNowPlayingUpdate).toHaveBeenCalledWith('event-123', null);

      // Verify state is cleaned up
      await expect(service.getStatus('event-123')).resolves.toMatchObject({
        initialized: false,
      });
    });

    it('should throw NotFoundException if not initialized', async () => {
      await expect(service.stop('event-999')).rejects.toThrow(
        new NotFoundException('Playback not initialized for event event-999')
      );
    });
  });
});
