import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Request } from 'express';
import { QueueService } from './queue.service';
import { AddToQueueDto } from './dto/add-to-queue.dto';
import { QueueItemResponseDto } from './dto/queue-item-response.dto';

@ApiTags('Queue')
@Controller('events/:eventId/queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Get()
  @ApiOperation({
    summary: 'Get event queue',
    description: 'Get all unplayed tracks in the queue, sorted by score',
  })
  @ApiParam({
    name: 'eventId',
    description: 'Event ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Queue items',
    type: [QueueItemResponseDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Event not found',
  })
  getQueue(@Param('eventId') eventId: string) {
    return this.queueService.getQueue(eventId);
  }

  @Post()
  @ApiOperation({
    summary: 'Add track to queue',
    description:
      'Add a track to the event queue or increment vote count if already exists',
  })
  @ApiParam({
    name: 'eventId',
    description: 'Event ID',
  })
  @ApiResponse({
    status: 201,
    description: 'Track added to queue or vote incremented',
    type: QueueItemResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Event is not active',
  })
  @ApiResponse({
    status: 404,
    description: 'Event not found',
  })
  addToQueue(
    @Param('eventId') eventId: string,
    @Body() addToQueueDto: AddToQueueDto,
    @Req() request: Request,
  ) {
    // Extract IP address (handle proxy headers)
    const ipAddress =
      (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      request.socket.remoteAddress ||
      'unknown';

    return this.queueService.addToQueue(eventId, addToQueueDto, ipAddress);
  }

  @Delete(':trackId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remove track from queue',
    description: 'Remove a specific track from the event queue',
  })
  @ApiParam({
    name: 'eventId',
    description: 'Event ID',
  })
  @ApiParam({
    name: 'trackId',
    description: 'Spotify track ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Track removed from queue',
  })
  @ApiResponse({
    status: 404,
    description: 'Track not found in queue',
  })
  removeFromQueue(
    @Param('eventId') eventId: string,
    @Param('trackId') trackId: string,
  ) {
    return this.queueService.removeFromQueue(eventId, trackId);
  }

  @Get('next')
  @ApiOperation({
    summary: 'Get next track to play',
    description: 'Get the highest-scoring unplayed track from the queue',
  })
  @ApiParam({
    name: 'eventId',
    description: 'Event ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Next track to play',
    type: QueueItemResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Event not found or queue is empty',
  })
  getNextTrack(@Param('eventId') eventId: string) {
    return this.queueService.getNextTrack(eventId);
  }

  @Post(':trackId/played')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark track as played',
    description: 'Mark a track as played and remove it from active queue',
  })
  @ApiParam({
    name: 'eventId',
    description: 'Event ID',
  })
  @ApiParam({
    name: 'trackId',
    description: 'Spotify track ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Track marked as played',
    type: QueueItemResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Track not found in queue',
  })
  markAsPlayed(
    @Param('eventId') eventId: string,
    @Param('trackId') trackId: string,
  ) {
    return this.queueService.markAsPlayed(eventId, trackId);
  }

  @Post(':trackId/skip')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Skip track',
    description: 'Skip a track (mark as played but skipped)',
  })
  @ApiParam({
    name: 'eventId',
    description: 'Event ID',
  })
  @ApiParam({
    name: 'trackId',
    description: 'Spotify track ID',
  })
  @ApiQuery({
    name: 'reason',
    required: false,
    description: 'Reason for skipping',
  })
  @ApiResponse({
    status: 200,
    description: 'Track skipped',
    type: QueueItemResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Track not found in queue',
  })
  skipTrack(
    @Param('eventId') eventId: string,
    @Param('trackId') trackId: string,
    @Query('reason') reason?: string,
  ) {
    return this.queueService.skipTrack(eventId, trackId, reason);
  }

  @Post('update-scores')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update all queue scores',
    description: 'Recalculate scores for all tracks in queue (for recency bonus)',
  })
  @ApiParam({
    name: 'eventId',
    description: 'Event ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Scores updated',
  })
  updateScores(@Param('eventId') eventId: string) {
    return this.queueService.updateAllScores(eventId);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Clear queue',
    description: 'Remove all unplayed tracks from the queue',
  })
  @ApiParam({
    name: 'eventId',
    description: 'Event ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Queue cleared',
  })
  @ApiResponse({
    status: 404,
    description: 'Event not found',
  })
  clearQueue(@Param('eventId') eventId: string) {
    return this.queueService.clearQueue(eventId);
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Get queue statistics',
    description: 'Get statistics about the event queue',
  })
  @ApiParam({
    name: 'eventId',
    description: 'Event ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Queue statistics',
  })
  getStats(@Param('eventId') eventId: string) {
    return this.queueService.getQueueStats(eventId);
  }

  @Get('remaining-votes/:sessionId')
  @ApiOperation({
    summary: 'Get remaining votes for session',
    description: 'Check how many votes a session has remaining in the current hour',
  })
  @ApiParam({
    name: 'eventId',
    description: 'Event ID',
  })
  @ApiParam({
    name: 'sessionId',
    description: 'Session ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Remaining votes count',
  })
  getRemainingVotes(
    @Param('eventId') eventId: string,
    @Param('sessionId') sessionId: string,
  ) {
    return this.queueService.getRemainingVotes(eventId, sessionId);
  }
}
