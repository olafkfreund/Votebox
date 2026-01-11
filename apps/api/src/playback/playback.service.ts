import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SpotifyApiService } from '../spotify/spotify-api.service';
import { QueueService } from '../queue/queue.service';
import { WebSocketGatewayService } from '../websocket/websocket.gateway';

interface PlaybackState {
  eventId: string;
  currentTrackId: string | null;
  deviceId: string | null;
  isPlaying: boolean;
  startedAt: Date | null;
  trackDuration: number | null;
  autoPlayEnabled: boolean;
  transitionTimer: NodeJS.Timeout | null;
}

@Injectable()
export class PlaybackService {
  private readonly logger = new Logger(PlaybackService.name);
  private playbackStates: Map<string, PlaybackState> = new Map();

  constructor(
    private readonly prisma: PrismaService,
    private readonly spotifyApi: SpotifyApiService,
    private readonly queueService: QueueService,
    private readonly websocket: WebSocketGatewayService,
  ) {}

  /**
   * Initialize playback for an event
   */
  async initializePlayback(
    eventId: string,
    deviceId: string,
  ): Promise<{ message: string; deviceId: string }> {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { venue: true },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    if (event.status !== 'ACTIVE') {
      throw new BadRequestException('Event must be active to enable playback');
    }

    // Verify device exists
    const devices = await this.spotifyApi.getDevices(event.venueId);
    const device = devices.find((d) => d.id === deviceId);

    if (!device) {
      throw new NotFoundException(`Spotify device with ID ${deviceId} not found`);
    }

    // Initialize playback state
    const state: PlaybackState = {
      eventId,
      currentTrackId: null,
      deviceId,
      isPlaying: false,
      startedAt: null,
      trackDuration: null,
      autoPlayEnabled: true,
      transitionTimer: null,
    };

    this.playbackStates.set(eventId, state);

    this.logger.log(`Playback initialized for event ${eventId} on device ${deviceId}`);

    return {
      message: 'Playback initialized successfully',
      deviceId,
    };
  }

  /**
   * Start playing the next track in the queue
   */
  async playNext(eventId: string): Promise<any> {
    const state = this.getPlaybackState(eventId);
    const event = await this.getEvent(eventId);

    // Get next track from queue
    const nextTrack = await this.queueService.getNextTrack(eventId);

    if (!nextTrack) {
      this.logger.log(`No tracks in queue for event ${eventId}`);

      // Stop playback if no tracks
      if (state.isPlaying) {
        await this.spotifyApi.pausePlayback(event.venueId, state.deviceId);
      }

      state.isPlaying = false;
      state.currentTrackId = null;
      this.clearTransitionTimer(state);

      this.websocket.emitNowPlayingUpdate(eventId, null);

      return {
        message: 'Queue is empty',
        nowPlaying: null,
      };
    }

    // Play the track on Spotify
    try {
      await this.spotifyApi.playTrack(
        event.venueId,
        nextTrack.trackUri,
        state.deviceId,
      );

      // Mark track as playing in database
      await this.queueService.markAsPlayed(eventId, nextTrack.trackId);

      // Update playback state
      state.currentTrackId = nextTrack.trackId;
      state.isPlaying = true;
      state.startedAt = new Date();
      state.trackDuration = nextTrack.duration;

      // Schedule next track transition
      this.scheduleNextTrack(state);

      // Broadcast now playing update
      this.websocket.emitNowPlayingUpdate(eventId, {
        id: nextTrack.id,
        trackUri: nextTrack.trackUri,
        trackName: nextTrack.trackName,
        artistName: nextTrack.artistName,
        albumName: nextTrack.albumName,
        albumArt: nextTrack.albumArt,
        duration: nextTrack.duration,
        startedAt: state.startedAt,
      });

      this.logger.log(
        `Now playing: ${nextTrack.trackName} by ${nextTrack.artistName} (Event: ${eventId})`,
      );

      return {
        message: 'Track started playing',
        nowPlaying: nextTrack,
      };
    } catch (error) {
      this.logger.error(`Failed to play track: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to start playback: ${error.message}`);
    }
  }

  /**
   * Pause current playback
   */
  async pause(eventId: string): Promise<{ message: string }> {
    const state = this.getPlaybackState(eventId);
    const event = await this.getEvent(eventId);

    if (!state.isPlaying) {
      throw new BadRequestException('Playback is already paused');
    }

    await this.spotifyApi.pausePlayback(event.venueId, state.deviceId);

    state.isPlaying = false;
    this.clearTransitionTimer(state);

    this.logger.log(`Playback paused for event ${eventId}`);

    return { message: 'Playback paused' };
  }

  /**
   * Resume playback
   */
  async resume(eventId: string): Promise<{ message: string }> {
    const state = this.getPlaybackState(eventId);
    const event = await this.getEvent(eventId);

    if (state.isPlaying) {
      throw new BadRequestException('Playback is already active');
    }

    if (!state.currentTrackId) {
      // No current track, play next from queue
      return this.playNext(eventId);
    }

    // Resume current track
    const queueItem = await this.prisma.queueItem.findFirst({
      where: {
        eventId,
        trackId: state.currentTrackId,
      },
    });

    if (queueItem) {
      await this.spotifyApi.playTrack(
        event.venueId,
        queueItem.trackUri,
        state.deviceId,
      );

      state.isPlaying = true;

      // Recalculate remaining time and schedule transition
      if (state.startedAt && state.trackDuration) {
        const elapsed = Date.now() - state.startedAt.getTime();
        const remaining = state.trackDuration - elapsed;

        if (remaining > 0) {
          this.scheduleNextTrack(state);
        } else {
          // Track should have finished, play next
          return this.playNext(eventId);
        }
      }

      this.logger.log(`Playback resumed for event ${eventId}`);

      return { message: 'Playback resumed' };
    }

    // Current track not found, play next
    return this.playNext(eventId);
  }

  /**
   * Skip to next track immediately
   */
  async skip(eventId: string): Promise<any> {
    const state = this.getPlaybackState(eventId);

    this.clearTransitionTimer(state);

    this.logger.log(`Skipping track for event ${eventId}`);

    return this.playNext(eventId);
  }

  /**
   * Enable or disable auto-play
   */
  async setAutoPlay(
    eventId: string,
    enabled: boolean,
  ): Promise<{ message: string; autoPlayEnabled: boolean }> {
    const state = this.getPlaybackState(eventId);

    state.autoPlayEnabled = enabled;

    if (!enabled) {
      this.clearTransitionTimer(state);
    } else if (state.isPlaying && state.trackDuration) {
      // Re-schedule transition if auto-play is re-enabled
      this.scheduleNextTrack(state);
    }

    this.logger.log(`Auto-play ${enabled ? 'enabled' : 'disabled'} for event ${eventId}`);

    return {
      message: `Auto-play ${enabled ? 'enabled' : 'disabled'}`,
      autoPlayEnabled: enabled,
    };
  }

  /**
   * Get current playback status
   */
  async getStatus(eventId: string): Promise<any> {
    const state = this.playbackStates.get(eventId);

    if (!state) {
      return {
        eventId,
        initialized: false,
        isPlaying: false,
        currentTrack: null,
        autoPlayEnabled: false,
      };
    }

    let currentTrack = null;
    if (state.currentTrackId) {
      currentTrack = await this.prisma.queueItem.findFirst({
        where: {
          eventId,
          trackId: state.currentTrackId,
        },
      });
    }

    const elapsed = state.startedAt
      ? Date.now() - state.startedAt.getTime()
      : null;

    const remaining =
      state.trackDuration && elapsed
        ? Math.max(0, state.trackDuration - elapsed)
        : null;

    return {
      eventId,
      initialized: true,
      isPlaying: state.isPlaying,
      deviceId: state.deviceId,
      currentTrack: currentTrack
        ? {
            trackId: currentTrack.trackId,
            trackName: currentTrack.trackName,
            artistName: currentTrack.artistName,
            albumArt: currentTrack.albumArt,
            duration: currentTrack.duration,
            startedAt: state.startedAt,
            elapsed,
            remaining,
          }
        : null,
      autoPlayEnabled: state.autoPlayEnabled,
    };
  }

  /**
   * Stop playback and cleanup state
   */
  async stop(eventId: string): Promise<{ message: string }> {
    const state = this.playbackStates.get(eventId);

    if (!state) {
      throw new NotFoundException(`Playback not initialized for event ${eventId}`);
    }

    const event = await this.getEvent(eventId);

    // Pause Spotify playback
    if (state.isPlaying) {
      try {
        await this.spotifyApi.pausePlayback(event.venueId, state.deviceId);
      } catch (error) {
        this.logger.warn(`Failed to pause Spotify: ${error.message}`);
      }
    }

    // Clear timer and state
    this.clearTransitionTimer(state);
    this.playbackStates.delete(eventId);

    this.websocket.emitNowPlayingUpdate(eventId, null);

    this.logger.log(`Playback stopped for event ${eventId}`);

    return { message: 'Playback stopped' };
  }

  /**
   * Schedule automatic transition to next track
   */
  private scheduleNextTrack(state: PlaybackState): void {
    // Clear any existing timer
    this.clearTransitionTimer(state);

    if (!state.autoPlayEnabled || !state.trackDuration) {
      return;
    }

    // Calculate remaining time
    const elapsed = state.startedAt
      ? Date.now() - state.startedAt.getTime()
      : 0;

    const remaining = state.trackDuration - elapsed;

    if (remaining <= 0) {
      // Track should have already finished, play next immediately
      this.playNext(state.eventId).catch((error) => {
        this.logger.error(
          `Failed to auto-play next track: ${error.message}`,
          error.stack,
        );
      });
      return;
    }

    // Schedule next track with small buffer (500ms) to ensure smooth transition
    const delay = Math.max(0, remaining - 500);

    state.transitionTimer = setTimeout(() => {
      this.logger.log(`Auto-playing next track for event ${state.eventId}`);

      this.playNext(state.eventId).catch((error) => {
        this.logger.error(
          `Failed to auto-play next track: ${error.message}`,
          error.stack,
        );
      });
    }, delay);

    this.logger.debug(
      `Next track scheduled in ${Math.round(delay / 1000)}s for event ${state.eventId}`,
    );
  }

  /**
   * Clear transition timer
   */
  private clearTransitionTimer(state: PlaybackState): void {
    if (state.transitionTimer) {
      clearTimeout(state.transitionTimer);
      state.transitionTimer = null;
    }
  }

  /**
   * Get playback state or throw
   */
  private getPlaybackState(eventId: string): PlaybackState {
    const state = this.playbackStates.get(eventId);

    if (!state) {
      throw new BadRequestException(
        `Playback not initialized for event ${eventId}. Call /playback/initialize first.`,
      );
    }

    return state;
  }

  /**
   * Get event or throw
   */
  private async getEvent(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { venue: true },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    return event;
  }

  /**
   * Cleanup playback states on module destroy
   */
  onModuleDestroy() {
    this.logger.log('Cleaning up playback states...');

    for (const [eventId, state] of this.playbackStates.entries()) {
      this.clearTransitionTimer(state);
      this.logger.log(`Cleaned up playback state for event ${eventId}`);
    }

    this.playbackStates.clear();
  }
}
