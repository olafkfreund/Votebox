import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddToQueueDto {
  @ApiProperty({
    description: 'Spotify track ID',
    example: '3n3Ppam7vgaVa1iaRUc9Lp',
  })
  @IsString()
  @IsNotEmpty()
  trackId: string;

  @ApiProperty({
    description: 'Spotify track URI',
    example: 'spotify:track:3n3Ppam7vgaVa1iaRUc9Lp',
  })
  @IsString()
  @IsNotEmpty()
  trackUri: string;

  @ApiProperty({
    description: 'Track name',
    example: 'Dopesmoker',
  })
  @IsString()
  @IsNotEmpty()
  trackName: string;

  @ApiProperty({
    description: 'Artist name',
    example: 'Sleep',
  })
  @IsString()
  @IsNotEmpty()
  artistName: string;

  @ApiProperty({
    description: 'Album name',
    example: 'Dopesmoker',
  })
  @IsString()
  @IsNotEmpty()
  albumName: string;

  @ApiPropertyOptional({
    description: 'Album artwork URL',
    example: 'https://i.scdn.co/image/...',
  })
  @IsOptional()
  @IsString()
  albumArt?: string;

  @ApiProperty({
    description: 'Track duration in seconds',
    example: 3841,
  })
  @IsNotEmpty()
  duration: number;

  @ApiPropertyOptional({
    description: 'Session ID of user adding track (for tracking)',
    example: 'session-abc123',
  })
  @IsOptional()
  @IsString()
  addedBy?: string;
}
