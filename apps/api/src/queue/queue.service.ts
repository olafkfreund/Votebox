import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddToQueueDto } from './dto/add-to-queue.dto';
import { WebSocketGatewayService } from '../websocket/websocket.gateway';
import { VoteTrackerService } from './vote-tracker.service';

@Injectable()
export class QueueService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly websocket: WebSocketGatewayService,
    private readonly voteTracker: VoteTrackerService
  ) {}

  /**
   * Calculate queue score based on votes, recency, diversity, and recently played
   *
   * Score formula:
   * score = (votes × 1.0) + (recency_factor × 0.3) + (diversity_bonus × 0.2) - (recently_played_penalty × 0.5)
   *
   * Scaled to maintain similar ranges as before:
   * - Base score: voteCount × 10
   * - Recency factor: 0-30 points based on last vote time
   * - Diversity bonus: +5 points if artist not in last 5 played tracks
   * - Recently played penalty: -15 points if track or artist played in last 30 minutes
   */
  private async calculateScore(
    eventId: string,
    trackId: string,
    artistName: string,
    voteCount: number,
    lastVotedAt: Date | null
  ): Promise<number> {
    const baseScore = voteCount * 10;
    const now = new Date();

    // Recency factor: boost recently voted tracks
    let recencyFactor = 0;
    if (lastVotedAt) {
      const minutesAgo = (now.getTime() - lastVotedAt.getTime()) / (1000 * 60);
      if (minutesAgo <= 5) {
        recencyFactor = 30; // 0-5 min: +30
      } else if (minutesAgo <= 15) {
        recencyFactor = 20; // 5-15 min: +20
      } else if (minutesAgo <= 30) {
        recencyFactor = 10; // 15-30 min: +10
      }
    }

    // Diversity bonus: boost tracks from artists not recently played
    let diversityBonus = 0;
    const recentlyPlayed = await this.prisma.queueItem.findMany({
      where: {
        eventId,
        isPlayed: true,
      },
      orderBy: {
        playedAt: 'desc',
      },
      take: 5,
      select: {
        artistName: true,
      },
    });

    const recentArtists = recentlyPlayed.map((item) => item.artistName);
    if (!recentArtists.includes(artistName)) {
      diversityBonus = 5;
    }

    // Recently played penalty: penalize tracks/artists played in last 30 minutes
    let recentlyPlayedPenalty = 0;
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

    const recentlyPlayedSameTrack = await this.prisma.queueItem.findFirst({
      where: {
        eventId,
        trackId,
        isPlayed: true,
        playedAt: {
          gte: thirtyMinutesAgo,
        },
      },
    });

    if (recentlyPlayedSameTrack) {
      // Same track played recently: heavy penalty
      recentlyPlayedPenalty = 20;
    } else {
      // Check if same artist played recently
      const recentlyPlayedSameArtist = await this.prisma.queueItem.findFirst({
        where: {
          eventId,
          artistName,
          isPlayed: true,
          playedAt: {
            gte: thirtyMinutesAgo,
          },
        },
      });

      if (recentlyPlayedSameArtist) {
        recentlyPlayedPenalty = 10; // Same artist: moderate penalty
      }
    }

    // Calculate final score
    const score = baseScore + recencyFactor + diversityBonus - recentlyPlayedPenalty;

    return Math.max(0, score); // Never return negative scores
  }

  /**
   * Add track to queue or increment vote count if already exists
   */
  async addToQueue(eventId: string, dto: AddToQueueDto, ipAddress: string) {
    // Verify session ID is provided
    if (!dto.addedBy) {
      throw new BadRequestException('Session ID is required');
    }

    // Check anti-spam measures
    await this.voteTracker.checkAndRecordVote(eventId, dto.trackId, dto.addedBy, ipAddress);

    // Verify event exists and is active
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    if (event.status !== 'ACTIVE') {
      throw new BadRequestException('Can only add tracks to active events');
    }

    // Check if track already in queue
    const existingItem = await this.prisma.queueItem.findFirst({
      where: {
        eventId,
        trackId: dto.trackId,
        isPlayed: false,
      },
    });

    if (existingItem) {
      // Increment vote count and update score
      const now = new Date();
      const newVoteCount = existingItem.voteCount + 1;
      const newScore = await this.calculateScore(
        eventId,
        dto.trackId,
        dto.artistName,
        newVoteCount,
        now
      );

      const updatedItem = await this.prisma.queueItem.update({
        where: { id: existingItem.id },
        data: {
          voteCount: newVoteCount,
          lastVotedAt: now,
          score: newScore,
        },
      });

      // Recalculate positions
      await this.recalculatePositions(eventId);

      // Emit queue update via WebSocket
      const updatedQueue = await this.getQueue(eventId);
      this.websocket.emitQueueUpdate(eventId, updatedQueue);

      return updatedItem;
    }

    // Add new track to queue
    const now = new Date();
    const score = await this.calculateScore(eventId, dto.trackId, dto.artistName, 1, now);

    const queueItem = await this.prisma.queueItem.create({
      data: {
        eventId,
        trackId: dto.trackId,
        trackUri: dto.trackUri,
        trackName: dto.trackName,
        artistName: dto.artistName,
        albumName: dto.albumName,
        albumArt: dto.albumArt,
        duration: dto.duration,
        voteCount: 1,
        lastVotedAt: new Date(),
        score,
        position: 0, // Will be recalculated
        addedBy: dto.addedBy || 'system',
      },
    });

    // Recalculate positions
    await this.recalculatePositions(eventId);

    // Update event stats
    await this.updateEventStats(eventId);

    // Emit queue update via WebSocket
    const updatedQueue = await this.getQueue(eventId);
    this.websocket.emitQueueUpdate(eventId, updatedQueue);

    return this.findOne(queueItem.id);
  }

  /**
   * Get current queue for an event
   */
  async getQueue(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    const queueItems = await this.prisma.queueItem.findMany({
      where: {
        eventId,
        isPlayed: false,
      },
      orderBy: [{ score: 'desc' }, { addedAt: 'asc' }],
    });

    return queueItems;
  }

  /**
   * Get single queue item
   */
  async findOne(id: string) {
    const queueItem = await this.prisma.queueItem.findUnique({
      where: { id },
    });

    if (!queueItem) {
      throw new NotFoundException(`Queue item with ID ${id} not found`);
    }

    return queueItem;
  }

  /**
   * Remove track from queue
   */
  async removeFromQueue(eventId: string, trackId: string) {
    const queueItem = await this.prisma.queueItem.findFirst({
      where: {
        eventId,
        trackId,
        isPlayed: false,
      },
    });

    if (!queueItem) {
      throw new NotFoundException(`Track ${trackId} not found in queue for event ${eventId}`);
    }

    await this.prisma.queueItem.delete({
      where: { id: queueItem.id },
    });

    // Recalculate positions
    await this.recalculatePositions(eventId);

    // Update event stats
    await this.updateEventStats(eventId);

    // Emit queue update via WebSocket
    const updatedQueue = await this.getQueue(eventId);
    this.websocket.emitQueueUpdate(eventId, updatedQueue);

    return { message: 'Track removed from queue successfully' };
  }

  /**
   * Mark track as played
   */
  async markAsPlayed(eventId: string, trackId: string) {
    const queueItem = await this.prisma.queueItem.findFirst({
      where: {
        eventId,
        trackId,
        isPlayed: false,
      },
    });

    if (!queueItem) {
      throw new NotFoundException(`Track ${trackId} not found in queue for event ${eventId}`);
    }

    const updatedItem = await this.prisma.queueItem.update({
      where: { id: queueItem.id },
      data: {
        isPlayed: true,
        playedAt: new Date(),
      },
    });

    // Recalculate positions for remaining tracks
    await this.recalculatePositions(eventId);

    // Emit queue update via WebSocket
    const updatedQueue = await this.getQueue(eventId);
    this.websocket.emitQueueUpdate(eventId, updatedQueue);

    return updatedItem;
  }

  /**
   * Skip track (mark as played but skipped)
   */
  async skipTrack(eventId: string, trackId: string, reason?: string) {
    const queueItem = await this.prisma.queueItem.findFirst({
      where: {
        eventId,
        trackId,
        isPlayed: false,
      },
    });

    if (!queueItem) {
      throw new NotFoundException(`Track ${trackId} not found in queue for event ${eventId}`);
    }

    const updatedItem = await this.prisma.queueItem.update({
      where: { id: queueItem.id },
      data: {
        isPlayed: true,
        playedAt: new Date(),
        skipped: true,
        skippedReason: reason,
      },
    });

    // Recalculate positions for remaining tracks
    await this.recalculatePositions(eventId);

    // Emit queue update via WebSocket
    const updatedQueue = await this.getQueue(eventId);
    this.websocket.emitQueueUpdate(eventId, updatedQueue);

    return updatedItem;
  }

  /**
   * Get next track to play (highest score, not played)
   */
  async getNextTrack(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    if (event.status !== 'ACTIVE') {
      throw new BadRequestException('Event is not active');
    }

    const nextTrack = await this.prisma.queueItem.findFirst({
      where: {
        eventId,
        isPlayed: false,
      },
      orderBy: [{ score: 'desc' }, { addedAt: 'asc' }],
    });

    if (!nextTrack) {
      return null;
    }

    return nextTrack;
  }

  /**
   * Recalculate queue positions based on score
   */
  private async recalculatePositions(eventId: string) {
    // Get all unplayed tracks sorted by score
    const queueItems = await this.prisma.queueItem.findMany({
      where: {
        eventId,
        isPlayed: false,
      },
      orderBy: [{ score: 'desc' }, { addedAt: 'asc' }],
    });

    // Update positions
    const updates = queueItems.map((item, index) =>
      this.prisma.queueItem.update({
        where: { id: item.id },
        data: { position: index + 1 },
      })
    );

    await this.prisma.$transaction(updates);
  }

  /**
   * Update all scores in queue (for recency recalculation)
   */
  async updateAllScores(eventId: string) {
    const queueItems = await this.prisma.queueItem.findMany({
      where: {
        eventId,
        isPlayed: false,
      },
    });

    const updatePromises = await Promise.all(
      queueItems.map(async (item) => {
        const newScore = await this.calculateScore(
          eventId,
          item.trackId,
          item.artistName,
          item.voteCount,
          item.lastVotedAt
        );
        return this.prisma.queueItem.update({
          where: { id: item.id },
          data: { score: newScore },
        });
      })
    );

    await this.prisma.$transaction(updatePromises);

    // Recalculate positions after score update
    await this.recalculatePositions(eventId);
  }

  /**
   * Clear entire queue (for testing or admin purposes)
   */
  async clearQueue(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    await this.prisma.queueItem.deleteMany({
      where: {
        eventId,
        isPlayed: false,
      },
    });

    return { message: 'Queue cleared successfully' };
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(eventId: string) {
    const totalTracks = await this.prisma.queueItem.count({
      where: {
        eventId,
        isPlayed: false,
      },
    });

    const totalVotes = await this.prisma.queueItem.aggregate({
      where: {
        eventId,
        isPlayed: false,
      },
      _sum: {
        voteCount: true,
      },
    });

    const playedTracks = await this.prisma.queueItem.count({
      where: {
        eventId,
        isPlayed: true,
      },
    });

    const skippedTracks = await this.prisma.queueItem.count({
      where: {
        eventId,
        isPlayed: true,
        skipped: true,
      },
    });

    return {
      totalTracks,
      totalVotes: totalVotes._sum.voteCount || 0,
      playedTracks,
      skippedTracks,
    };
  }

  /**
   * Update event stats (total tracks, total votes)
   */
  private async updateEventStats(eventId: string) {
    const stats = await this.getQueueStats(eventId);

    await this.prisma.event.update({
      where: { id: eventId },
      data: {
        totalTracks: stats.totalTracks,
      },
    });
  }

  /**
   * Get remaining votes for a session
   */
  async getRemainingVotes(eventId: string, sessionId: string) {
    const remaining = this.voteTracker.getRemainingVotes(eventId, sessionId);
    return {
      remaining,
      limit: 3,
      message:
        remaining > 0
          ? `You have ${remaining} vote${remaining !== 1 ? 's' : ''} remaining this hour`
          : 'Vote limit reached. Try again in an hour',
    };
  }
}
