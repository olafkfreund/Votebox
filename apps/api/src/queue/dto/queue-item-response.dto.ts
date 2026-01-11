import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class QueueItemResponseDto {
  @ApiProperty({ example: 'queue-item-123' })
  id: string;

  @ApiProperty({ example: 'event-123' })
  eventId: string;

  @ApiProperty({ example: '3n3Ppam7vgaVa1iaRUc9Lp' })
  trackId: string;

  @ApiProperty({ example: 'spotify:track:3n3Ppam7vgaVa1iaRUc9Lp' })
  trackUri: string;

  @ApiProperty({ example: 'Dopesmoker' })
  trackName: string;

  @ApiProperty({ example: 'Sleep' })
  artistName: string;

  @ApiProperty({ example: 'Dopesmoker' })
  albumName: string;

  @ApiPropertyOptional({ example: 'https://i.scdn.co/image/...' })
  albumArt?: string;

  @ApiProperty({ example: 3841 })
  duration: number;

  @ApiProperty({ example: 1 })
  position: number;

  @ApiProperty({ example: 85.5 })
  score: number;

  @ApiProperty({ example: 5 })
  voteCount: number;

  @ApiPropertyOptional({ example: '2024-12-31T20:30:00Z' })
  lastVotedAt?: Date;

  @ApiProperty({ example: '2024-12-31T20:00:00Z' })
  addedAt: Date;

  @ApiProperty({ example: 'session-abc123' })
  addedBy: string;

  @ApiProperty({ example: false })
  isPlayed: boolean;

  @ApiPropertyOptional({ example: '2024-12-31T20:35:00Z' })
  playedAt?: Date;

  @ApiProperty({ example: false })
  skipped: boolean;

  @ApiPropertyOptional({ example: 'Duplicate track' })
  skippedReason?: string;
}
