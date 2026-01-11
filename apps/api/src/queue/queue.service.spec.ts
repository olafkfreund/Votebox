import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { QueueService } from './queue.service';
import { PrismaService } from '../prisma/prisma.service';
import { WebSocketGatewayService } from '../websocket/websocket.gateway';
import { VoteTrackerService } from './vote-tracker.service';

describe('QueueService', () => {
  let service: QueueService;

  const mockPrismaService = {
    event: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    queueItem: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    $transaction: jest.fn((operations) => Promise.all(operations)),
  };

  const mockWebSocketGateway = {
    emitQueueUpdate: jest.fn(),
    emitVoteUpdate: jest.fn(),
    emitNowPlayingUpdate: jest.fn(),
    emitEventStatusChange: jest.fn(),
  };

  const mockVoteTracker = {
    checkAndRecordVote: jest.fn(),
    getRemainingVotes: jest.fn().mockReturnValue(3),
    getVoteStats: jest.fn(),
    clearSessionVotes: jest.fn(),
  };

  const mockEvent = {
    id: 'event-123',
    venueId: 'venue-123',
    name: 'Doom Rock Night',
    status: 'ACTIVE',
    totalTracks: 0,
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
    duration: 3841,
    position: 1,
    score: 30,
    voteCount: 1,
    lastVotedAt: new Date(),
    addedAt: new Date(),
    addedBy: 'session-123',
    isPlayed: false,
    playedAt: null,
    skipped: false,
    skippedReason: null,
  };

  const addToQueueDto = {
    trackId: 'track-456',
    trackUri: 'spotify:track:track-456',
    trackName: 'Holy Mountain',
    artistName: 'Sleep',
    albumName: 'Holy Mountain',
    albumArt: 'https://example.com/art2.jpg',
    duration: 480,
    addedBy: 'session-456',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: WebSocketGatewayService,
          useValue: mockWebSocketGateway,
        },
        {
          provide: VoteTrackerService,
          useValue: mockVoteTracker,
        },
      ],
    }).compile();

    service = module.get<QueueService>(QueueService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('addToQueue', () => {
    it('should add new track to queue', async () => {
      mockVoteTracker.checkAndRecordVote.mockResolvedValue(undefined);
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockPrismaService.queueItem.findFirst.mockResolvedValue(null);
      mockPrismaService.queueItem.findMany.mockResolvedValue([]); // For diversity bonus
      mockPrismaService.queueItem.create.mockResolvedValue({
        ...mockQueueItem,
        ...addToQueueDto,
        id: 'new-queue-item',
      });
      mockPrismaService.queueItem.findUnique.mockResolvedValue({
        ...mockQueueItem,
        ...addToQueueDto,
      });
      mockPrismaService.queueItem.count.mockResolvedValue(1);
      mockPrismaService.queueItem.aggregate.mockResolvedValue({
        _sum: { voteCount: 1 },
      });

      const result = await service.addToQueue('event-123', addToQueueDto, '192.168.1.1');

      expect(mockVoteTracker.checkAndRecordVote).toHaveBeenCalledWith(
        'event-123',
        addToQueueDto.trackId,
        addToQueueDto.addedBy,
        '192.168.1.1'
      );
      expect(mockPrismaService.event.findUnique).toHaveBeenCalledWith({
        where: { id: 'event-123' },
      });
      expect(mockPrismaService.queueItem.create).toHaveBeenCalled();
      expect(result.trackId).toBe(addToQueueDto.trackId);
    });

    it('should increment vote count for existing track', async () => {
      mockVoteTracker.checkAndRecordVote.mockResolvedValue(undefined);
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockPrismaService.queueItem.findFirst.mockResolvedValue(mockQueueItem);
      mockPrismaService.queueItem.findMany.mockResolvedValue([]); // For diversity and recently played checks
      mockPrismaService.queueItem.update.mockResolvedValue({
        ...mockQueueItem,
        voteCount: 2,
        score: 40,
      });

      const result = await service.addToQueue('event-123', addToQueueDto, '192.168.1.1');

      expect(mockPrismaService.queueItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockQueueItem.id },
          data: expect.objectContaining({
            voteCount: 2,
          }),
        })
      );
      expect(result.voteCount).toBe(2);
    });

    it('should throw NotFoundException if event not found', async () => {
      mockVoteTracker.checkAndRecordVote.mockResolvedValue(undefined);
      mockPrismaService.event.findUnique.mockResolvedValue(null);

      await expect(service.addToQueue('event-999', addToQueueDto, '192.168.1.1')).rejects.toThrow(
        new NotFoundException('Event with ID event-999 not found')
      );
    });

    it('should throw BadRequestException if event not active', async () => {
      mockVoteTracker.checkAndRecordVote.mockResolvedValue(undefined);
      mockPrismaService.event.findUnique.mockResolvedValue({
        ...mockEvent,
        status: 'ENDED',
      });

      await expect(service.addToQueue('event-123', addToQueueDto, '192.168.1.1')).rejects.toThrow(
        new BadRequestException('Can only add tracks to active events')
      );
    });

    it('should throw BadRequestException if session ID not provided', async () => {
      const dtoWithoutSession = { ...addToQueueDto, addedBy: undefined };

      await expect(
        service.addToQueue('event-123', dtoWithoutSession, '192.168.1.1')
      ).rejects.toThrow(new BadRequestException('Session ID is required'));
    });

    it('should throw error from vote tracker if spam detected', async () => {
      mockVoteTracker.checkAndRecordVote.mockRejectedValue(
        new BadRequestException('Please wait 25 seconds before voting again')
      );

      await expect(service.addToQueue('event-123', addToQueueDto, '192.168.1.1')).rejects.toThrow(
        new BadRequestException('Please wait 25 seconds before voting again')
      );
    });
  });

  describe('getQueue', () => {
    it('should return queue sorted by score', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockPrismaService.queueItem.findMany.mockResolvedValue([
        mockQueueItem,
        { ...mockQueueItem, id: 'queue-456', score: 50, position: 1 },
      ]);

      const result = await service.getQueue('event-123');

      expect(mockPrismaService.queueItem.findMany).toHaveBeenCalledWith({
        where: {
          eventId: 'event-123',
          isPlayed: false,
        },
        orderBy: [{ score: 'desc' }, { addedAt: 'asc' }],
      });
      expect(result.length).toBe(2);
    });

    it('should throw NotFoundException if event not found', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(null);

      await expect(service.getQueue('event-999')).rejects.toThrow(
        new NotFoundException('Event with ID event-999 not found')
      );
    });
  });

  describe('findOne', () => {
    it('should return queue item by id', async () => {
      mockPrismaService.queueItem.findUnique.mockResolvedValue(mockQueueItem);

      const result = await service.findOne('queue-123');

      expect(mockPrismaService.queueItem.findUnique).toHaveBeenCalledWith({
        where: { id: 'queue-123' },
      });
      expect(result).toEqual(mockQueueItem);
    });

    it('should throw NotFoundException if item not found', async () => {
      mockPrismaService.queueItem.findUnique.mockResolvedValue(null);

      await expect(service.findOne('queue-999')).rejects.toThrow(
        new NotFoundException('Queue item with ID queue-999 not found')
      );
    });
  });

  describe('removeFromQueue', () => {
    it('should remove track from queue', async () => {
      mockPrismaService.queueItem.findFirst.mockResolvedValue(mockQueueItem);
      mockPrismaService.queueItem.delete.mockResolvedValue(mockQueueItem);
      mockPrismaService.queueItem.findMany.mockResolvedValue([]);
      mockPrismaService.queueItem.count.mockResolvedValue(0);
      mockPrismaService.queueItem.aggregate.mockResolvedValue({
        _sum: { voteCount: 0 },
      });

      const result = await service.removeFromQueue('event-123', 'track-123');

      expect(mockPrismaService.queueItem.delete).toHaveBeenCalledWith({
        where: { id: mockQueueItem.id },
      });
      expect(result.message).toBe('Track removed from queue successfully');
    });

    it('should throw NotFoundException if track not in queue', async () => {
      mockPrismaService.queueItem.findFirst.mockResolvedValue(null);

      await expect(service.removeFromQueue('event-123', 'track-999')).rejects.toThrow(
        new NotFoundException('Track track-999 not found in queue for event event-123')
      );
    });
  });

  describe('markAsPlayed', () => {
    it('should mark track as played', async () => {
      mockPrismaService.queueItem.findFirst.mockResolvedValue(mockQueueItem);
      mockPrismaService.queueItem.update.mockResolvedValue({
        ...mockQueueItem,
        isPlayed: true,
        playedAt: expect.any(Date),
      });
      mockPrismaService.queueItem.findMany.mockResolvedValue([]);

      const result = await service.markAsPlayed('event-123', 'track-123');

      expect(mockPrismaService.queueItem.update).toHaveBeenCalledWith({
        where: { id: mockQueueItem.id },
        data: {
          isPlayed: true,
          playedAt: expect.any(Date),
        },
      });
      expect(result.isPlayed).toBe(true);
    });

    it('should throw NotFoundException if track not found', async () => {
      mockPrismaService.queueItem.findFirst.mockResolvedValue(null);

      await expect(service.markAsPlayed('event-123', 'track-999')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('skipTrack', () => {
    it('should skip track with reason', async () => {
      mockPrismaService.queueItem.findFirst.mockResolvedValue(mockQueueItem);
      mockPrismaService.queueItem.update.mockResolvedValue({
        ...mockQueueItem,
        isPlayed: true,
        playedAt: expect.any(Date),
        skipped: true,
        skippedReason: 'Duplicate',
      });
      mockPrismaService.queueItem.findMany.mockResolvedValue([]);

      const result = await service.skipTrack('event-123', 'track-123', 'Duplicate');

      expect(mockPrismaService.queueItem.update).toHaveBeenCalledWith({
        where: { id: mockQueueItem.id },
        data: {
          isPlayed: true,
          playedAt: expect.any(Date),
          skipped: true,
          skippedReason: 'Duplicate',
        },
      });
      expect(result.skipped).toBe(true);
      expect(result.skippedReason).toBe('Duplicate');
    });
  });

  describe('getNextTrack', () => {
    it('should return highest-scoring unplayed track', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockPrismaService.queueItem.findFirst.mockResolvedValue(mockQueueItem);

      const result = await service.getNextTrack('event-123');

      expect(mockPrismaService.queueItem.findFirst).toHaveBeenCalledWith({
        where: {
          eventId: 'event-123',
          isPlayed: false,
        },
        orderBy: [{ score: 'desc' }, { addedAt: 'asc' }],
      });
      expect(result).toEqual(mockQueueItem);
    });

    it('should return null if queue is empty', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockPrismaService.queueItem.findFirst.mockResolvedValue(null);

      const result = await service.getNextTrack('event-123');

      expect(result).toBeNull();
    });

    it('should throw BadRequestException if event not active', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({
        ...mockEvent,
        status: 'ENDED',
      });

      await expect(service.getNextTrack('event-123')).rejects.toThrow(
        new BadRequestException('Event is not active')
      );
    });
  });

  describe('clearQueue', () => {
    it('should delete all unplayed tracks', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockPrismaService.queueItem.deleteMany.mockResolvedValue({ count: 5 });

      const result = await service.clearQueue('event-123');

      expect(mockPrismaService.queueItem.deleteMany).toHaveBeenCalledWith({
        where: {
          eventId: 'event-123',
          isPlayed: false,
        },
      });
      expect(result.message).toBe('Queue cleared successfully');
    });

    it('should throw NotFoundException if event not found', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(null);

      await expect(service.clearQueue('event-999')).rejects.toThrow(
        new NotFoundException('Event with ID event-999 not found')
      );
    });
  });

  describe('getQueueStats', () => {
    it('should return queue statistics', async () => {
      mockPrismaService.queueItem.count
        .mockResolvedValueOnce(5) // totalTracks
        .mockResolvedValueOnce(3) // playedTracks
        .mockResolvedValueOnce(1); // skippedTracks

      mockPrismaService.queueItem.aggregate.mockResolvedValue({
        _sum: { voteCount: 25 },
      });

      const result = await service.getQueueStats('event-123');

      expect(result).toEqual({
        totalTracks: 5,
        totalVotes: 25,
        playedTracks: 3,
        skippedTracks: 1,
      });
    });
  });

  describe('updateAllScores', () => {
    it('should recalculate scores for all tracks', async () => {
      const mockItems = [
        { ...mockQueueItem, id: 'queue-1', voteCount: 5, lastVotedAt: new Date() },
        { ...mockQueueItem, id: 'queue-2', voteCount: 3, lastVotedAt: new Date() },
      ];

      mockPrismaService.queueItem.findMany.mockResolvedValue(mockItems);
      mockPrismaService.queueItem.update.mockResolvedValue(mockQueueItem);

      await service.updateAllScores('event-123');

      expect(mockPrismaService.queueItem.update).toHaveBeenCalledTimes(2);
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });
  });
});
