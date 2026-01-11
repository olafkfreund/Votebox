import { Controller, Post, Get, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { PlaybackService } from './playback.service';

class InitializePlaybackDto {
  deviceId: string;
}

class SetAutoPlayDto {
  enabled: boolean;
}

@ApiTags('Playback')
@Controller('events/:eventId/playback')
export class PlaybackController {
  constructor(private readonly playbackService: PlaybackService) {}

  @Post('initialize')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Initialize playback for an event',
    description: 'Set up automated playback on a Spotify device',
  })
  @ApiParam({
    name: 'eventId',
    description: 'Event ID',
  })
  @ApiBody({
    type: InitializePlaybackDto,
    description: 'Spotify device ID to play music on',
  })
  @ApiResponse({
    status: 200,
    description: 'Playback initialized successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Event not active or invalid device',
  })
  @ApiResponse({
    status: 404,
    description: 'Event or device not found',
  })
  async initialize(@Param('eventId') eventId: string, @Body() dto: InitializePlaybackDto) {
    return this.playbackService.initializePlayback(eventId, dto.deviceId);
  }

  @Post('play-next')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Play the next track from the queue',
    description: 'Automatically plays the highest-scoring track in the queue',
  })
  @ApiParam({
    name: 'eventId',
    description: 'Event ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Track started playing',
  })
  @ApiResponse({
    status: 400,
    description: 'Playback not initialized or Spotify error',
  })
  @ApiResponse({
    status: 404,
    description: 'Event not found',
  })
  async playNext(@Param('eventId') eventId: string) {
    return this.playbackService.playNext(eventId);
  }

  @Post('pause')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Pause current playback',
    description: 'Pauses the currently playing track',
  })
  @ApiParam({
    name: 'eventId',
    description: 'Event ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Playback paused',
  })
  @ApiResponse({
    status: 400,
    description: 'Playback already paused or not initialized',
  })
  async pause(@Param('eventId') eventId: string) {
    return this.playbackService.pause(eventId);
  }

  @Post('resume')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resume playback',
    description: 'Resumes the current track or plays next if no current track',
  })
  @ApiParam({
    name: 'eventId',
    description: 'Event ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Playback resumed',
  })
  @ApiResponse({
    status: 400,
    description: 'Playback already active or not initialized',
  })
  async resume(@Param('eventId') eventId: string) {
    return this.playbackService.resume(eventId);
  }

  @Post('skip')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Skip to next track',
    description: 'Immediately skips the current track and plays the next one',
  })
  @ApiParam({
    name: 'eventId',
    description: 'Event ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Track skipped, next track playing',
  })
  @ApiResponse({
    status: 400,
    description: 'Playback not initialized',
  })
  async skip(@Param('eventId') eventId: string) {
    return this.playbackService.skip(eventId);
  }

  @Post('auto-play')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Enable or disable auto-play',
    description: 'Control automatic track transitions when current track ends',
  })
  @ApiParam({
    name: 'eventId',
    description: 'Event ID',
  })
  @ApiBody({
    type: SetAutoPlayDto,
    description: 'Auto-play enabled/disabled',
  })
  @ApiResponse({
    status: 200,
    description: 'Auto-play setting updated',
  })
  @ApiResponse({
    status: 400,
    description: 'Playback not initialized',
  })
  async setAutoPlay(@Param('eventId') eventId: string, @Body() dto: SetAutoPlayDto) {
    return this.playbackService.setAutoPlay(eventId, dto.enabled);
  }

  @Get('status')
  @ApiOperation({
    summary: 'Get current playback status',
    description: 'Returns current playback state, track, and progress',
  })
  @ApiParam({
    name: 'eventId',
    description: 'Event ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Playback status retrieved',
  })
  async getStatus(@Param('eventId') eventId: string) {
    return this.playbackService.getStatus(eventId);
  }

  @Post('stop')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Stop playback and cleanup',
    description: 'Stops playback and removes playback state for the event',
  })
  @ApiParam({
    name: 'eventId',
    description: 'Event ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Playback stopped',
  })
  @ApiResponse({
    status: 404,
    description: 'Playback not initialized',
  })
  async stop(@Param('eventId') eventId: string) {
    return this.playbackService.stop(eventId);
  }
}
