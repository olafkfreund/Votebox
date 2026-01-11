import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsDateString,
  IsOptional,
  IsObject,
  MinLength,
  MaxLength,
  IsISO8601,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

enum PlaylistSource {
  GENRE = 'GENRE',
  SPOTIFY_PLAYLIST = 'SPOTIFY_PLAYLIST',
  CUSTOM = 'CUSTOM',
}

enum Recurrence {
  NONE = 'NONE',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

export class CreateEventDto {
  @ApiProperty({
    description: 'Venue ID that owns this event',
    example: 'clu123abc456',
  })
  @IsString()
  @IsNotEmpty()
  venueId: string;

  @ApiProperty({
    description: 'Event name',
    example: 'Doom Rock Night',
    minLength: 3,
    maxLength: 200,
  })
  @IsString()
  @MinLength(3, { message: 'Event name must be at least 3 characters' })
  @MaxLength(200, { message: 'Event name must not exceed 200 characters' })
  name: string;

  @ApiPropertyOptional({
    description: 'Event description',
    example: 'Vote for your favorite doom and stoner rock tracks',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({
    description: 'Scheduled date (YYYY-MM-DD)',
    example: '2024-12-31',
  })
  @IsDateString()
  scheduledDate: string;

  @ApiProperty({
    description: 'Event start time (ISO 8601)',
    example: '2024-12-31T20:00:00Z',
  })
  @IsISO8601()
  startTime: string;

  @ApiProperty({
    description: 'Event end time (ISO 8601)',
    example: '2024-12-31T23:59:00Z',
  })
  @IsISO8601()
  endTime: string;

  @ApiPropertyOptional({
    description: 'Timezone',
    example: 'America/New_York',
    default: 'UTC',
  })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({
    description: 'Event recurrence pattern',
    enum: Recurrence,
    default: Recurrence.NONE,
  })
  @IsOptional()
  @IsEnum(Recurrence)
  recurrence?: Recurrence;

  @ApiPropertyOptional({
    description: 'Recurrence end date (YYYY-MM-DD)',
    example: '2025-12-31',
  })
  @IsOptional()
  @IsDateString()
  recurrenceEnd?: string;

  @ApiProperty({
    description: 'Playlist source type',
    enum: PlaylistSource,
    example: PlaylistSource.GENRE,
  })
  @IsEnum(PlaylistSource)
  playlistSource: PlaylistSource;

  @ApiProperty({
    description: 'Playlist configuration (JSON)',
    example: {
      genres: ['doom-metal', 'stoner-rock'],
      excludeExplicit: false,
    },
  })
  @IsObject()
  playlistConfig: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Voting rules configuration (JSON)',
    example: {
      votesPerHour: 3,
      cooldownMinutes: 20,
      maxQueueSize: 50,
    },
  })
  @IsOptional()
  @IsObject()
  votingRules?: Record<string, any>;
}
