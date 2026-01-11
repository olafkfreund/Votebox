import {
  Controller,
  Get,
  Post,
  Delete,
  Query,
  Param,
  Redirect,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { SpotifyAuthService } from './spotify-auth.service';
import { SpotifyApiService } from './spotify-api.service';
import {
  SpotifyAuthResponseDto,
  SpotifyCallbackResponseDto,
  SpotifyStatusResponseDto,
} from './dto/spotify-auth-response.dto';

@ApiTags('Spotify')
@Controller('spotify')
export class SpotifyController {
  constructor(
    private readonly spotifyAuthService: SpotifyAuthService,
    private readonly spotifyApiService: SpotifyApiService,
  ) {}

  @Get('authorize')
  @ApiOperation({
    summary: 'Start Spotify OAuth flow',
    description: 'Generate Spotify authorization URL for venue to connect their account',
  })
  @ApiQuery({
    name: 'venueId',
    required: true,
    description: 'Venue ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Authorization URL generated',
    type: SpotifyAuthResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid venue ID',
  })
  authorize(@Query('venueId') venueId: string): SpotifyAuthResponseDto {
    if (!venueId) {
      throw new BadRequestException('venueId is required');
    }

    return this.spotifyAuthService.getAuthorizationUrl(venueId);
  }

  @Get('callback')
  @ApiOperation({
    summary: 'Handle Spotify OAuth callback',
    description: 'Exchange authorization code for tokens and link Spotify account to venue',
  })
  @ApiQuery({
    name: 'code',
    required: true,
    description: 'Authorization code from Spotify',
  })
  @ApiQuery({
    name: 'state',
    required: true,
    description: 'State parameter for CSRF protection',
  })
  @ApiQuery({
    name: 'error',
    required: false,
    description: 'Error from Spotify (if user denied)',
  })
  @ApiResponse({
    status: 200,
    description: 'Spotify account connected successfully',
    type: SpotifyCallbackResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid callback parameters',
  })
  @Redirect()
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error?: string,
  ) {
    // Handle user denial
    if (error) {
      return {
        url: `/admin/spotify/error?error=${error}`,
        statusCode: 302,
      };
    }

    if (!code || !state) {
      throw new BadRequestException('code and state are required');
    }

    const result = await this.spotifyAuthService.handleCallback(code, state);

    // Redirect to admin dashboard with success
    return {
      url: `/admin/spotify/success?venueId=${result.venueId}`,
      statusCode: 302,
    };
  }

  @Get('status/:venueId')
  @ApiOperation({
    summary: 'Get Spotify connection status',
    description: 'Check if venue has connected Spotify account and token status',
  })
  @ApiParam({
    name: 'venueId',
    description: 'Venue ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Spotify connection status',
    type: SpotifyStatusResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Venue not found',
  })
  getStatus(@Param('venueId') venueId: string): Promise<SpotifyStatusResponseDto> {
    return this.spotifyAuthService.getStatus(venueId);
  }

  @Post('refresh/:venueId')
  @ApiOperation({
    summary: 'Refresh Spotify access token',
    description: 'Manually refresh the Spotify access token using refresh token',
  })
  @ApiParam({
    name: 'venueId',
    description: 'Venue ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'No refresh token available',
  })
  @ApiResponse({
    status: 404,
    description: 'Venue not found',
  })
  async refreshToken(@Param('venueId') venueId: string) {
    const accessToken = await this.spotifyAuthService.refreshAccessToken(venueId);

    return {
      success: true,
      message: 'Access token refreshed successfully',
      expiresIn: 3600,
    };
  }

  @Delete('disconnect/:venueId')
  @ApiOperation({
    summary: 'Disconnect Spotify account',
    description: 'Remove Spotify account connection from venue',
  })
  @ApiParam({
    name: 'venueId',
    description: 'Venue ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Spotify account disconnected',
  })
  @ApiResponse({
    status: 400,
    description: 'No Spotify account connected',
  })
  @ApiResponse({
    status: 404,
    description: 'Venue not found',
  })
  disconnect(@Param('venueId') venueId: string) {
    return this.spotifyAuthService.disconnect(venueId);
  }

  @Get('search/:venueId')
  @ApiOperation({
    summary: 'Search Spotify tracks',
    description: 'Search for tracks on Spotify',
  })
  @ApiParam({
    name: 'venueId',
    description: 'Venue ID',
  })
  @ApiQuery({
    name: 'q',
    description: 'Search query',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of results (default: 20)',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    description: 'Offset for pagination (default: 0)',
  })
  @ApiResponse({
    status: 200,
    description: 'Search results',
  })
  async searchTracks(
    @Param('venueId') venueId: string,
    @Query('q') query: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const offsetNum = offset ? parseInt(offset, 10) : 0;

    return this.spotifyApiService.searchTracks(venueId, query, limitNum, offsetNum);
  }

  @Get('playlists/:venueId')
  @ApiOperation({
    summary: 'Get user playlists',
    description: "Get the venue's Spotify playlists",
  })
  @ApiParam({
    name: 'venueId',
    description: 'Venue ID',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of results (default: 20)',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    description: 'Offset for pagination (default: 0)',
  })
  @ApiResponse({
    status: 200,
    description: 'User playlists',
  })
  async getUserPlaylists(
    @Param('venueId') venueId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const offsetNum = offset ? parseInt(offset, 10) : 0;

    return this.spotifyApiService.getUserPlaylists(venueId, limitNum, offsetNum);
  }

  @Get('playlist/:venueId/:playlistId')
  @ApiOperation({
    summary: 'Get playlist tracks',
    description: 'Get all tracks from a Spotify playlist',
  })
  @ApiParam({
    name: 'venueId',
    description: 'Venue ID',
  })
  @ApiParam({
    name: 'playlistId',
    description: 'Spotify Playlist ID',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of results (default: 100)',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    description: 'Offset for pagination (default: 0)',
  })
  @ApiResponse({
    status: 200,
    description: 'Playlist tracks',
  })
  async getPlaylistTracks(
    @Param('venueId') venueId: string,
    @Param('playlistId') playlistId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 100;
    const offsetNum = offset ? parseInt(offset, 10) : 0;

    return this.spotifyApiService.getPlaylistTracks(
      venueId,
      playlistId,
      limitNum,
      offsetNum,
    );
  }

  @Get('genres/:venueId')
  @ApiOperation({
    summary: 'Get available genre seeds',
    description: 'Get list of all available Spotify genre seeds',
  })
  @ApiParam({
    name: 'venueId',
    description: 'Venue ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Available genre seeds',
  })
  async getGenres(@Param('venueId') venueId: string) {
    const genres = await this.spotifyApiService.getAvailableGenreSeeds(venueId);

    return { genres };
  }

  @Get('recommendations/:venueId')
  @ApiOperation({
    summary: 'Get track recommendations',
    description: 'Get Spotify track recommendations based on seed genres',
  })
  @ApiParam({
    name: 'venueId',
    description: 'Venue ID',
  })
  @ApiQuery({
    name: 'genres',
    required: false,
    description: 'Comma-separated genre seeds',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of results (default: 20)',
  })
  @ApiResponse({
    status: 200,
    description: 'Track recommendations',
  })
  async getRecommendations(
    @Param('venueId') venueId: string,
    @Query('genres') genres?: string,
    @Query('limit') limit?: string,
  ) {
    const seedGenres = genres ? genres.split(',') : [];
    const limitNum = limit ? parseInt(limit, 10) : 20;

    const tracks = await this.spotifyApiService.getRecommendations(venueId, {
      seedGenres,
      limit: limitNum,
    });

    return { tracks };
  }

  @Get('devices/:venueId')
  @ApiOperation({
    summary: 'Get available playback devices',
    description: "Get the venue's available Spotify playback devices",
  })
  @ApiParam({
    name: 'venueId',
    description: 'Venue ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Available devices',
  })
  async getDevices(@Param('venueId') venueId: string) {
    const devices = await this.spotifyApiService.getDevices(venueId);

    return { devices };
  }
}
