import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddToQueueDto } from './dto/add-to-queue.dto';
import { WebSocketGatewayService } from '../websocket/websocket.gateway';

@Injectable()
export class QueueService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly websocket: WebSocketGatewayService,
  ) {}

  /**
   * Calculate queue score based on votes and recency
   * Score = voteCount * 10 + recencyBonus
   * Recency bonus: tracks voted in last 5 minutes get +20 points
   */
  private calculateScore(voteCount: number, lastVotedAt: Date | null): number {
    const baseScore = voteCount * 10;

    if (!lastVotedAt) {
      return baseScore;
    }

    // Recency bonus: tracks voted in last 5 minutes get boost
    const now = new Date();
    const minutesAgo = (now.getTime() - lastVotedAt.getTime()) / (1000 * 60);

    let recencyBonus = 0;
    if (minutesAgo <= 5) {
      recencyBonus = 20;
    } else if (minutesAgo <= 15) {
      recencyBonus = 10;
    } else if (minutesAgo <= 30) {
      recencyBonus = 5;
    }

    return baseScore + recencyBonus;
  }

  /**
   * Add track to queue or increment vote count if already exists
   */
  async addToQueue(eventId: string, dto: AddToQueueDto) {
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
      const newScore = this.calculateScore(newVoteCount, now);

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
    const score = this.calculateScore(1, new Date());

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
      orderBy: [
        { score: 'desc' },
        { addedAt: 'asc' },
      ],
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
      throw new NotFoundException(
        `Track ${trackId} not found in queue for event ${eventId}`,
      );
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
      throw new NotFoundException(
        `Track ${trackId} not found in queue for event ${eventId}`,
      );
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
      throw new NotFoundException(
        `Track ${trackId} not found in queue for event ${eventId}`,
      );
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
      orderBy: [
        { score: 'desc' },
        { addedAt: 'asc' },
      ],
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
      orderBy: [
        { score: 'desc' },
        { addedAt: 'asc' },
      ],
    });

    // Update positions
    const updates = queueItems.map((item, index) =>
      this.prisma.queueItem.update({
        where: { id: item.id },
        data: { position: index + 1 },
      }),
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

    const updates = queueItems.map((item) => {
      const newScore = this.calculateScore(item.voteCount, item.lastVotedAt);
      return this.prisma.queueItem.update({
        where: { id: item.id },
        data: { score: newScore },
      });
    });

    await this.prisma.$transaction(updates);

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
}
