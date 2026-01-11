import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PlaylistConfig, VotingRules } from './create-event.dto';

export class EventResponseDto {
  @ApiProperty({ example: 'clu123abc456' })
  id: string;

  @ApiProperty({ example: 'clu789xyz012' })
  venueId: string;

  @ApiProperty({ example: 'Doom Rock Night' })
  name: string;

  @ApiPropertyOptional({ example: 'Vote for your favorite doom and stoner rock tracks' })
  description?: string;

  @ApiProperty({ example: '2024-12-31' })
  scheduledDate: Date;

  @ApiProperty({ example: '2024-12-31T20:00:00Z' })
  startTime: Date;

  @ApiProperty({ example: '2024-12-31T23:59:00Z' })
  endTime: Date;

  @ApiProperty({ example: 'America/New_York' })
  timezone: string;

  @ApiProperty({ example: 'NONE', enum: ['NONE', 'DAILY', 'WEEKLY', 'MONTHLY'] })
  recurrence: string;

  @ApiPropertyOptional({ example: '2025-12-31' })
  recurrenceEnd?: Date;

  @ApiProperty({ example: 'GENRE', enum: ['GENRE', 'SPOTIFY_PLAYLIST', 'CUSTOM'] })
  playlistSource: string;

  @ApiProperty({
    example: {
      genres: ['doom-metal', 'stoner-rock'],
      excludeExplicit: false,
    },
  })
  playlistConfig: PlaylistConfig;

  @ApiProperty({
    example: {
      votesPerHour: 3,
      cooldownMinutes: 20,
      maxQueueSize: 50,
    },
  })
  votingRules: VotingRules;

  @ApiProperty({ example: 'UPCOMING', enum: ['UPCOMING', 'ACTIVE', 'ENDED', 'CANCELLED'] })
  status: string;

  @ApiPropertyOptional({ example: '2024-12-31T20:00:00Z' })
  activatedAt?: Date;

  @ApiPropertyOptional({ example: '2024-12-31T23:59:00Z' })
  endedAt?: Date;

  @ApiPropertyOptional({ example: 'spotify_device_123' })
  spotifyDeviceId?: string;

  @ApiPropertyOptional({ example: '3n3Ppam7vgaVa1iaRUc9Lp' })
  currentTrackId?: string;

  @ApiPropertyOptional({ example: '2024-12-31T20:30:00Z' })
  currentTrackStartedAt?: Date;

  @ApiProperty({ example: 127 })
  totalVotes: number;

  @ApiProperty({ example: 45 })
  totalTracks: number;

  @ApiProperty({ example: 23 })
  uniqueVoters: number;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  updatedAt: Date;
}
