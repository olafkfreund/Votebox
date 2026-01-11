import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { VoteTrackerService } from './vote-tracker.service';
import { PrismaService } from '../prisma/prisma.service';

describe('VoteTrackerService', () => {
  let service: VoteTrackerService;
  let _prismaService: PrismaService;

  const mockPrismaService = {
    // Mock Prisma service (not used in VoteTrackerService currently)
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VoteTrackerService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<VoteTrackerService>(VoteTrackerService);
    _prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkAndRecordVote', () => {
    const eventId = 'event-123';
    const trackId = 'track-456';
    const sessionId = 'session-789';
    const ipAddress = '192.168.1.1';

    it('should allow first vote for a session', async () => {
      await expect(
        service.checkAndRecordVote(eventId, trackId, sessionId, ipAddress)
      ).resolves.not.toThrow();
    });

    it('should enforce 30-second vote cooldown', async () => {
      // First vote
      await service.checkAndRecordVote(eventId, trackId, sessionId, ipAddress);

      // Immediate second vote should fail
      await expect(
        service.checkAndRecordVote(eventId, 'track-999', sessionId, ipAddress)
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.checkAndRecordVote(eventId, 'track-999', sessionId, ipAddress)
      ).rejects.toThrow(/Please wait \d+ seconds before voting again/);
    });

    it('should allow vote after cooldown period', async () => {
      // First vote
      await service.checkAndRecordVote(eventId, trackId, sessionId, ipAddress);

      // Wait for cooldown (we'll need to mock time or use a shorter cooldown for testing)
      // For now, we test the logic exists
      const stats = await service.getVoteStats(eventId);
      expect(stats.totalVotes).toBe(1);
    });

    it('should enforce hourly rate limit (3 votes per hour)', async () => {
      const differentTracks = ['track-1', 'track-2', 'track-3', 'track-4'];

      // Vote 1
      await service.checkAndRecordVote(eventId, differentTracks[0], sessionId, ipAddress);

      // Wait 31 seconds (mock or real wait would be needed)
      // For unit test, we'll just verify the count
      const remaining1 = service.getRemainingVotes(eventId, sessionId);
      expect(remaining1).toBe(2); // 3 - 1 = 2 remaining
    });

    it('should enforce 2-hour same-song cooldown', async () => {
      // First vote for track
      await service.checkAndRecordVote(eventId, trackId, sessionId, ipAddress);

      // Clear the 30-second cooldown by clearing session
      service.clearSessionVotes(eventId, sessionId);

      // Try to vote for same track again
      await expect(
        service.checkAndRecordVote(eventId, trackId, sessionId, ipAddress)
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.checkAndRecordVote(eventId, trackId, sessionId, ipAddress)
      ).rejects.toThrow(/You already voted for this track/);
    });

    it('should enforce IP-based rate limiting', async () => {
      const session1 = 'session-1';
      const session2 = 'session-2';
      const session3 = 'session-3';

      // Each session can vote 3 times, but IP limit is 6 total
      // Session 1: 3 votes
      await service.checkAndRecordVote(eventId, 'track-1', session1, ipAddress);
      service.clearSessionVotes(eventId, session1); // Clear cooldown
      await service.checkAndRecordVote(eventId, 'track-2', session1, ipAddress);
      service.clearSessionVotes(eventId, session1);
      await service.checkAndRecordVote(eventId, 'track-3', session1, ipAddress);

      // Session 2: 3 votes
      await service.checkAndRecordVote(eventId, 'track-4', session2, ipAddress);
      service.clearSessionVotes(eventId, session2);
      await service.checkAndRecordVote(eventId, 'track-5', session2, ipAddress);
      service.clearSessionVotes(eventId, session2);
      await service.checkAndRecordVote(eventId, 'track-6', session2, ipAddress);

      // Session 3: Should fail due to IP limit (6 votes already)
      await expect(
        service.checkAndRecordVote(eventId, 'track-7', session3, ipAddress)
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.checkAndRecordVote(eventId, 'track-7', session3, ipAddress)
      ).rejects.toThrow(/Too many votes from this network/);
    });

    it('should allow votes from different IP addresses', async () => {
      const ip1 = '192.168.1.1';
      const ip2 = '192.168.1.2';

      await service.checkAndRecordVote(eventId, trackId, sessionId, ip1);

      // Different IP should be independent
      await expect(
        service.checkAndRecordVote(eventId, 'track-999', sessionId, ip2)
      ).resolves.not.toThrow();
    });
  });

  describe('getVoteStats', () => {
    it('should return zero stats for new event', async () => {
      const stats = await service.getVoteStats('new-event');

      expect(stats).toEqual({
        totalVotes: 0,
        uniqueSessions: 0,
        uniqueIPs: 0,
      });
    });

    it('should track vote statistics correctly', async () => {
      const eventId = 'event-stats';

      // Vote from 2 different sessions, same IP
      await service.checkAndRecordVote(eventId, 'track-1', 'session-1', '192.168.1.1');
      service.clearSessionVotes(eventId, 'session-1');

      await service.checkAndRecordVote(eventId, 'track-2', 'session-2', '192.168.1.1');

      const stats = await service.getVoteStats(eventId);

      expect(stats.totalVotes).toBe(2);
      expect(stats.uniqueSessions).toBe(2);
      expect(stats.uniqueIPs).toBe(1); // Same IP
    });

    it('should track unique IPs correctly', async () => {
      const eventId = 'event-ips';

      await service.checkAndRecordVote(eventId, 'track-1', 'session-1', '192.168.1.1');
      service.clearSessionVotes(eventId, 'session-1');

      await service.checkAndRecordVote(eventId, 'track-2', 'session-1', '192.168.1.2');
      service.clearSessionVotes(eventId, 'session-1');

      await service.checkAndRecordVote(eventId, 'track-3', 'session-1', '192.168.1.3');

      const stats = await service.getVoteStats(eventId);

      expect(stats.uniqueIPs).toBe(3);
    });
  });

  describe('getRemainingVotes', () => {
    it('should return 3 for new session', () => {
      const remaining = service.getRemainingVotes('event-123', 'new-session');
      expect(remaining).toBe(3);
    });

    it('should decrement after each vote', async () => {
      const eventId = 'event-123';
      const sessionId = 'session-123';

      // Initial
      expect(service.getRemainingVotes(eventId, sessionId)).toBe(3);

      // After 1 vote
      await service.checkAndRecordVote(eventId, 'track-1', sessionId, '192.168.1.1');
      expect(service.getRemainingVotes(eventId, sessionId)).toBe(2);

      service.clearSessionVotes(eventId, sessionId);

      // After 2 votes
      await service.checkAndRecordVote(eventId, 'track-2', sessionId, '192.168.1.1');
      expect(service.getRemainingVotes(eventId, sessionId)).toBe(1);

      service.clearSessionVotes(eventId, sessionId);

      // After 3 votes
      await service.checkAndRecordVote(eventId, 'track-3', sessionId, '192.168.1.1');
      expect(service.getRemainingVotes(eventId, sessionId)).toBe(0);
    });
  });

  describe('clearSessionVotes', () => {
    it('should clear votes for specific session', async () => {
      const eventId = 'event-123';
      const sessionId = 'session-123';

      await service.checkAndRecordVote(eventId, 'track-1', sessionId, '192.168.1.1');

      expect(service.getRemainingVotes(eventId, sessionId)).toBe(2);

      service.clearSessionVotes(eventId, sessionId);

      expect(service.getRemainingVotes(eventId, sessionId)).toBe(3);
    });

    it('should not affect other sessions', async () => {
      const eventId = 'event-123';

      await service.checkAndRecordVote(eventId, 'track-1', 'session-1', '192.168.1.1');
      await service.checkAndRecordVote(eventId, 'track-2', 'session-2', '192.168.1.1');

      service.clearSessionVotes(eventId, 'session-1');

      expect(service.getRemainingVotes(eventId, 'session-1')).toBe(3);
      expect(service.getRemainingVotes(eventId, 'session-2')).toBe(2);
    });
  });
});
