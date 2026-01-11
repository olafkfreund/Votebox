import { ApiProperty } from '@nestjs/swagger';

export class SpotifyAuthResponseDto {
  @ApiProperty({
    description: 'Spotify authorization URL',
    example: 'https://accounts.spotify.com/authorize?...',
  })
  authUrl: string;

  @ApiProperty({
    description: 'State parameter for CSRF protection',
    example: 'random-state-string',
  })
  state: string;
}

export class SpotifyCallbackResponseDto {
  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Success message',
    example: 'Spotify account connected successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Venue ID',
    example: 'venue-123',
  })
  venueId: string;

  @ApiProperty({
    description: 'Spotify account ID',
    example: 'spotify_user_123',
  })
  spotifyAccountId: string;
}

export class SpotifyStatusResponseDto {
  @ApiProperty({
    description: 'Whether Spotify is connected',
    example: true,
  })
  connected: boolean;

  @ApiProperty({
    description: 'Spotify account ID if connected',
    example: 'spotify_user_123',
    required: false,
  })
  spotifyAccountId?: string;

  @ApiProperty({
    description: 'Token expiry timestamp',
    example: '2024-12-31T23:59:00Z',
    required: false,
  })
  tokenExpiry?: Date;

  @ApiProperty({
    description: 'Whether token needs refresh',
    example: false,
    required: false,
  })
  needsRefresh?: boolean;
}
