import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { EventsService } from './events.service';
import { PrismaService } from '../prisma/prisma.service';
import { PlaylistSource, Recurrence } from './dto/create-event.dto';

describe('EventsService', () => {
  let service: EventsService;

  const mockPrismaService = {
    venue: {
      findUnique: jest.fn(),
    },
    event: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    vote: {
      count: jest.fn(),
    },
  };

  const mockVenue = {
    id: 'venue-123',
    name: 'Test Venue',
    slug: 'test-venue',
    email: 'test@venue.com',
  };

  const mockEvent = {
    id: 'event-123',
    venueId: 'venue-123',
    name: 'Doom Rock Night',
    description: 'Vote for doom metal tracks',
    scheduledDate: new Date('2024-12-31'),
    startTime: new Date('2024-12-31T20:00:00Z'),
    endTime: new Date('2024-12-31T23:59:00Z'),
    timezone: 'UTC',
    recurrence: 'NONE',
    recurrenceEnd: null,
    playlistSource: 'GENRE',
    playlistConfig: { genres: ['doom-metal'] },
    votingRules: { votesPerHour: 3 },
    status: 'UPCOMING',
    activatedAt: null,
    endedAt: null,
    spotifyDeviceId: null,
    currentTrackId: null,
    currentTrackStartedAt: null,
    totalVotes: 0,
    totalTracks: 0,
    uniqueVoters: 0,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const createEventDto = {
    venueId: 'venue-123',
    name: 'New Event',
    description: 'Test description',
    scheduledDate: '2024-12-31',
    startTime: '2024-12-31T20:00:00Z',
    endTime: '2024-12-31T23:59:00Z',
    timezone: 'UTC',
    recurrence: Recurrence.NONE,
    playlistSource: PlaylistSource.GENRE,
    playlistConfig: { genres: ['rock'] },
    votingRules: { votesPerHour: 3 },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new event', async () => {
      mockPrismaService.venue.findUnique.mockResolvedValue(mockVenue);
      mockPrismaService.event.findFirst.mockResolvedValue(null);
      mockPrismaService.event.create.mockResolvedValue(mockEvent);

      const result = await service.create(createEventDto);

      expect(mockPrismaService.venue.findUnique).toHaveBeenCalledWith({
        where: { id: createEventDto.venueId },
      });
      expect(mockPrismaService.event.findFirst).toHaveBeenCalled();
      expect(mockPrismaService.event.create).toHaveBeenCalled();
      expect(result).toEqual(mockEvent);
    });

    it('should throw NotFoundException if venue not found', async () => {
      mockPrismaService.venue.findUnique.mockResolvedValue(null);

      await expect(service.create(createEventDto)).rejects.toThrow(
        new NotFoundException(`Venue with ID ${createEventDto.venueId} not found`)
      );
    });

    it('should throw BadRequestException if end time before start time', async () => {
      const invalidDto = {
        ...createEventDto,
        startTime: '2024-12-31T23:59:00Z',
        endTime: '2024-12-31T20:00:00Z',
      };
      mockPrismaService.venue.findUnique.mockResolvedValue(mockVenue);

      await expect(service.create(invalidDto)).rejects.toThrow(
        new BadRequestException('End time must be after start time')
      );
    });

    it('should throw ConflictException if event overlaps', async () => {
      mockPrismaService.venue.findUnique.mockResolvedValue(mockVenue);
      mockPrismaService.event.findFirst.mockResolvedValue(mockEvent);

      await expect(service.create(createEventDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return all events', async () => {
      const mockEvents = [mockEvent];
      mockPrismaService.event.findMany.mockResolvedValue(mockEvents);

      const result = await service.findAll();

      expect(mockPrismaService.event.findMany).toHaveBeenCalledWith({
        where: {},
        include: expect.any(Object),
        orderBy: expect.any(Array),
      });
      expect(result).toEqual(mockEvents);
    });

    it('should filter by venueId', async () => {
      const mockEvents = [mockEvent];
      mockPrismaService.event.findMany.mockResolvedValue(mockEvents);

      const result = await service.findAll('venue-123');

      expect(mockPrismaService.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { venueId: 'venue-123' },
        })
      );
      expect(result).toEqual(mockEvents);
    });

    it('should filter by status', async () => {
      const mockEvents = [mockEvent];
      mockPrismaService.event.findMany.mockResolvedValue(mockEvents);

      const result = await service.findAll(undefined, 'ACTIVE');

      expect(mockPrismaService.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'ACTIVE' },
        })
      );
      expect(result).toEqual(mockEvents);
    });
  });

  describe('findOne', () => {
    it('should return an event by id', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);

      const result = await service.findOne('event-123');

      expect(mockPrismaService.event.findUnique).toHaveBeenCalledWith({
        where: { id: 'event-123' },
        include: expect.any(Object),
      });
      expect(result).toEqual(mockEvent);
    });

    it('should throw NotFoundException if event not found', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        new NotFoundException('Event with ID non-existent not found')
      );
    });
  });

  describe('findByVenue', () => {
    it('should return events for a venue', async () => {
      mockPrismaService.venue.findUnique.mockResolvedValue(mockVenue);
      mockPrismaService.event.findMany.mockResolvedValue([mockEvent]);

      const result = await service.findByVenue('venue-123');

      expect(mockPrismaService.venue.findUnique).toHaveBeenCalledWith({
        where: { id: 'venue-123' },
      });
      expect(result).toEqual([mockEvent]);
    });

    it('should throw NotFoundException if venue not found', async () => {
      mockPrismaService.venue.findUnique.mockResolvedValue(null);

      await expect(service.findByVenue('non-existent')).rejects.toThrow(
        new NotFoundException('Venue with ID non-existent not found')
      );
    });
  });

  describe('update', () => {
    const updateDto = {
      name: 'Updated Event Name',
      description: 'Updated description',
    };

    it('should update an event', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockPrismaService.event.update.mockResolvedValue({
        ...mockEvent,
        ...updateDto,
      });

      const result = await service.update('event-123', updateDto);

      expect(mockPrismaService.event.update).toHaveBeenCalledWith({
        where: { id: 'event-123' },
        data: expect.objectContaining(updateDto),
      });
      expect(result.name).toBe(updateDto.name);
    });

    it('should throw BadRequestException if updating ended event', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({
        ...mockEvent,
        status: 'ENDED',
      });

      await expect(service.update('event-123', updateDto)).rejects.toThrow(
        new BadRequestException('Cannot update an ended event')
      );
    });

    it('should throw BadRequestException if invalid time range', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);

      const invalidTimeDto = {
        startTime: '2024-12-31T23:59:00Z',
        endTime: '2024-12-31T20:00:00Z',
      };

      await expect(service.update('event-123', invalidTimeDto)).rejects.toThrow(
        new BadRequestException('End time must be after start time')
      );
    });
  });

  describe('activate', () => {
    it('should activate an event', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockPrismaService.event.findFirst.mockResolvedValue(null);
      mockPrismaService.event.update.mockResolvedValue({
        ...mockEvent,
        status: 'ACTIVE',
        activatedAt: new Date(),
      });

      const result = await service.activate('event-123');

      expect(mockPrismaService.event.update).toHaveBeenCalledWith({
        where: { id: 'event-123' },
        data: {
          status: 'ACTIVE',
          activatedAt: expect.any(Date),
        },
      });
      expect(result.status).toBe('ACTIVE');
    });

    it('should throw BadRequestException if not in UPCOMING status', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({
        ...mockEvent,
        status: 'ACTIVE',
      });

      await expect(service.activate('event-123')).rejects.toThrow(
        new BadRequestException('Cannot activate event with status: ACTIVE')
      );
    });

    it('should throw ConflictException if venue has active event', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockPrismaService.event.findFirst.mockResolvedValue({
        ...mockEvent,
        id: 'other-event',
        status: 'ACTIVE',
      });

      await expect(service.activate('event-123')).rejects.toThrow(ConflictException);
    });
  });

  describe('end', () => {
    it('should end an active event', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({
        ...mockEvent,
        status: 'ACTIVE',
      });
      mockPrismaService.event.update.mockResolvedValue({
        ...mockEvent,
        status: 'ENDED',
        endedAt: new Date(),
      });

      const result = await service.end('event-123');

      expect(mockPrismaService.event.update).toHaveBeenCalledWith({
        where: { id: 'event-123' },
        data: {
          status: 'ENDED',
          endedAt: expect.any(Date),
        },
      });
      expect(result.status).toBe('ENDED');
    });

    it('should throw BadRequestException if not active', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);

      await expect(service.end('event-123')).rejects.toThrow(
        new BadRequestException('Cannot end event with status: UPCOMING')
      );
    });
  });

  describe('cancel', () => {
    it('should cancel an event', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockPrismaService.event.update.mockResolvedValue({
        ...mockEvent,
        status: 'CANCELLED',
      });

      const result = await service.cancel('event-123');

      expect(mockPrismaService.event.update).toHaveBeenCalledWith({
        where: { id: 'event-123' },
        data: { status: 'CANCELLED' },
      });
      expect(result.status).toBe('CANCELLED');
    });

    it('should throw BadRequestException if already ended', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({
        ...mockEvent,
        status: 'ENDED',
      });

      await expect(service.cancel('event-123')).rejects.toThrow(
        new BadRequestException('Cannot cancel an ended event')
      );
    });

    it('should throw BadRequestException if already cancelled', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({
        ...mockEvent,
        status: 'CANCELLED',
      });

      await expect(service.cancel('event-123')).rejects.toThrow(
        new BadRequestException('Event is already cancelled')
      );
    });
  });

  describe('remove', () => {
    it('should delete an event with no votes', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockPrismaService.vote.count.mockResolvedValue(0);
      mockPrismaService.event.delete.mockResolvedValue(mockEvent);

      const result = await service.remove('event-123');

      expect(mockPrismaService.vote.count).toHaveBeenCalledWith({
        where: { eventId: 'event-123' },
      });
      expect(mockPrismaService.event.delete).toHaveBeenCalledWith({
        where: { id: 'event-123' },
      });
      expect(result.message).toBe('Event deleted successfully');
    });

    it('should throw BadRequestException if event is active', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({
        ...mockEvent,
        status: 'ACTIVE',
      });

      await expect(service.remove('event-123')).rejects.toThrow(
        new BadRequestException('Cannot delete an active event. Please end it first.')
      );
    });

    it('should throw BadRequestException if event has votes', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockPrismaService.vote.count.mockResolvedValue(5);

      await expect(service.remove('event-123')).rejects.toThrow(
        new BadRequestException(
          'Cannot delete event with existing votes. Please cancel it instead.'
        )
      );
    });
  });

  describe('updateStats', () => {
    it('should update event statistics', async () => {
      const stats = {
        totalVotes: 50,
        totalTracks: 20,
        uniqueVoters: 15,
      };
      mockPrismaService.event.update.mockResolvedValue({
        ...mockEvent,
        ...stats,
      });

      const result = await service.updateStats('event-123', stats);

      expect(mockPrismaService.event.update).toHaveBeenCalledWith({
        where: { id: 'event-123' },
        data: stats,
      });
      expect(result.totalVotes).toBe(stats.totalVotes);
    });
  });

  describe('updateCurrentTrack', () => {
    it('should set current track', async () => {
      mockPrismaService.event.update.mockResolvedValue({
        ...mockEvent,
        currentTrackId: 'track-123',
        currentTrackStartedAt: expect.any(Date),
      });

      const result = await service.updateCurrentTrack('event-123', 'track-123');

      expect(mockPrismaService.event.update).toHaveBeenCalledWith({
        where: { id: 'event-123' },
        data: {
          currentTrackId: 'track-123',
          currentTrackStartedAt: expect.any(Date),
        },
      });
      expect(result.currentTrackId).toBe('track-123');
    });

    it('should clear current track when null', async () => {
      mockPrismaService.event.update.mockResolvedValue({
        ...mockEvent,
        currentTrackId: null,
        currentTrackStartedAt: null,
      });

      const result = await service.updateCurrentTrack('event-123', null);

      expect(mockPrismaService.event.update).toHaveBeenCalledWith({
        where: { id: 'event-123' },
        data: {
          currentTrackId: null,
          currentTrackStartedAt: null,
        },
      });
      expect(result.currentTrackId).toBeNull();
    });
  });

  describe('setSpotifyDevice', () => {
    it('should set Spotify device ID', async () => {
      mockPrismaService.event.update.mockResolvedValue({
        ...mockEvent,
        spotifyDeviceId: 'device-123',
      });

      const result = await service.setSpotifyDevice('event-123', 'device-123');

      expect(mockPrismaService.event.update).toHaveBeenCalledWith({
        where: { id: 'event-123' },
        data: { spotifyDeviceId: 'device-123' },
      });
      expect(result.spotifyDeviceId).toBe('device-123');
    });
  });
});
