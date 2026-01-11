import {
  Controller,
  Post,
  Delete,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { QueueService } from './queue.service';

@ApiTags('Admin - Queue Management')
@Controller('admin/events/:eventId/queue')
export class AdminQueueController {
  constructor(private readonly queueService: QueueService) {}

  @Delete('clear')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Emergency: Clear entire queue',
    description: 'Remove all unplayed tracks from queue (admin only)',
  })
  @ApiParam({
    name: 'eventId',
    description: 'Event ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Queue cleared successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Event not found',
  })
  clearQueue(@Param('eventId') eventId: string) {
    return this.queueService.clearQueue(eventId);
  }

  @Post(':trackId/force-skip')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Force skip a track',
    description: 'Skip a track without waiting for it to play (admin only)',
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
    description: 'Reason for skipping (e.g., "inappropriate", "technical issue")',
  })
  @ApiResponse({
    status: 200,
    description: 'Track force skipped',
  })
  @ApiResponse({
    status: 404,
    description: 'Track not found in queue',
  })
  forceSkip(
    @Param('eventId') eventId: string,
    @Param('trackId') trackId: string,
    @Query('reason') reason?: string,
  ) {
    return this.queueService.skipTrack(
      eventId,
      trackId,
      reason || 'Skipped by admin',
    );
  }

  @Delete(':trackId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remove track from queue',
    description: 'Manually remove a track from the queue (admin only)',
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
    description: 'Track removed successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Track not found in queue',
  })
  removeTrack(
    @Param('eventId') eventId: string,
    @Param('trackId') trackId: string,
  ) {
    return this.queueService.removeFromQueue(eventId, trackId);
  }

  @Post('recalculate-scores')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Recalculate all queue scores',
    description:
      'Manually trigger score recalculation for all tracks (admin only)',
  })
  @ApiParam({
    name: 'eventId',
    description: 'Event ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Scores recalculated successfully',
  })
  recalculateScores(@Param('eventId') eventId: string) {
    return this.queueService.updateAllScores(eventId);
  }
}
