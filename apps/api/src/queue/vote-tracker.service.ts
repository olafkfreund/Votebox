import { Injectable, BadRequestException } from '@nestjs/common';

interface VoteRecord {
  sessionId: string;
  ipAddress: string;
  trackId: string;
  timestamp: number;
}

@Injectable()
export class VoteTrackerService {
  private voteCache: Map<string, VoteRecord[]> = new Map();

  // Rate limits
  private readonly VOTES_PER_HOUR = 3;
  private readonly VOTE_COOLDOWN_MS = 30 * 1000; // 30 seconds
  private readonly SAME_SONG_COOLDOWN_MS = 2 * 60 * 60 * 1000; // 2 hours
  private readonly HOUR_MS = 60 * 60 * 1000; // 1 hour

  constructor() {
    // Clean up old cache entries every 5 minutes
    setInterval(() => this.cleanupCache(), 5 * 60 * 1000);
  }

  /**
   * Check if a vote is allowed and record it
   */
  async checkAndRecordVote(
    eventId: string,
    trackId: string,
    sessionId: string,
    ipAddress: string,
  ): Promise<void> {
    const now = Date.now();
    const cacheKey = `${eventId}:${sessionId}`;

    // Get or initialize vote records for this session
    let voteRecords = this.voteCache.get(cacheKey) || [];

    // Clean old records (older than 2 hours)
    voteRecords = voteRecords.filter(
      (record) => now - record.timestamp < this.SAME_SONG_COOLDOWN_MS,
    );

    // Check 1: Vote cooldown (30 seconds between any votes)
    const lastVote = voteRecords[voteRecords.length - 1];
    if (lastVote && now - lastVote.timestamp < this.VOTE_COOLDOWN_MS) {
      const remainingSeconds = Math.ceil(
        (this.VOTE_COOLDOWN_MS - (now - lastVote.timestamp)) / 1000,
      );
      throw new BadRequestException(
        `Please wait ${remainingSeconds} seconds before voting again`,
      );
    }

    // Check 2: Rate limiting (3 votes per hour)
    const votesInLastHour = voteRecords.filter(
      (record) => now - record.timestamp < this.HOUR_MS,
    );
    if (votesInLastHour.length >= this.VOTES_PER_HOUR) {
      throw new BadRequestException(
        `Vote limit reached. You can vote ${this.VOTES_PER_HOUR} times per hour`,
      );
    }

    // Check 3: Same song cooldown (can't vote for same track within 2 hours)
    const recentSameTrackVote = voteRecords.find(
      (record) =>
        record.trackId === trackId &&
        now - record.timestamp < this.SAME_SONG_COOLDOWN_MS,
    );
    if (recentSameTrackVote) {
      const remainingMinutes = Math.ceil(
        (this.SAME_SONG_COOLDOWN_MS - (now - recentSameTrackVote.timestamp)) /
          (60 * 1000),
      );
      throw new BadRequestException(
        `You already voted for this track. Please wait ${remainingMinutes} minutes before voting for it again`,
      );
    }

    // Check 4: IP-based rate limiting (detect if same IP is using multiple sessions)
    const ipVotes = Array.from(this.voteCache.values())
      .flat()
      .filter(
        (record) =>
          record.ipAddress === ipAddress && now - record.timestamp < this.HOUR_MS,
      );

    if (ipVotes.length >= this.VOTES_PER_HOUR * 2) {
      throw new BadRequestException(
        'Too many votes from this network. Please try again later',
      );
    }

    // Record the vote
    voteRecords.push({
      sessionId,
      ipAddress,
      trackId,
      timestamp: now,
    });

    this.voteCache.set(cacheKey, voteRecords);
  }

  /**
   * Get vote statistics for an event
   */
  async getVoteStats(eventId: string): Promise<{
    totalVotes: number;
    uniqueSessions: number;
    uniqueIPs: number;
  }> {
    const allVotes: VoteRecord[] = [];

    // Collect all votes for this event
    for (const [key, records] of this.voteCache.entries()) {
      if (key.startsWith(`${eventId}:`)) {
        allVotes.push(...records);
      }
    }

    const uniqueSessions = new Set(allVotes.map((v) => v.sessionId)).size;
    const uniqueIPs = new Set(allVotes.map((v) => v.ipAddress)).size;

    return {
      totalVotes: allVotes.length,
      uniqueSessions,
      uniqueIPs,
    };
  }

  /**
   * Clear votes for a specific session (for testing or admin purposes)
   */
  clearSessionVotes(eventId: string, sessionId: string): void {
    const cacheKey = `${eventId}:${sessionId}`;
    this.voteCache.delete(cacheKey);
  }

  /**
   * Clean up old cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    const cutoff = now - this.SAME_SONG_COOLDOWN_MS;

    for (const [key, records] of this.voteCache.entries()) {
      const validRecords = records.filter(
        (record) => record.timestamp > cutoff,
      );

      if (validRecords.length === 0) {
        this.voteCache.delete(key);
      } else {
        this.voteCache.set(key, validRecords);
      }
    }
  }

  /**
   * Get remaining votes for a session
   */
  getRemainingVotes(eventId: string, sessionId: string): number {
    const cacheKey = `${eventId}:${sessionId}`;
    const voteRecords = this.voteCache.get(cacheKey) || [];
    const now = Date.now();

    const votesInLastHour = voteRecords.filter(
      (record) => now - record.timestamp < this.HOUR_MS,
    );

    return Math.max(0, this.VOTES_PER_HOUR - votesInLastHour.length);
  }
}
