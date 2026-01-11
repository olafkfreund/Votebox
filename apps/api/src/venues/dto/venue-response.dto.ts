import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VenueResponseDto {
  @ApiProperty({ example: 'clu123abc456' })
  id: string;

  @ApiProperty({ example: 'The Rock Pub' })
  name: string;

  @ApiProperty({ example: 'the-rock-pub' })
  slug: string;

  @ApiProperty({ example: 'owner@therockpub.com' })
  email: string;

  @ApiPropertyOptional({ example: 'spotify_account_123' })
  spotifyAccountId?: string;

  @ApiProperty({ example: { theme: 'dark', autoPlay: true } })
  settings: Record<string, any>;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  updatedAt: Date;

  @ApiPropertyOptional({ example: '2024-01-15T10:30:00Z' })
  lastLoginAt?: Date;
}
