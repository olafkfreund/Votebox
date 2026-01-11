import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export interface VenueSettings {
  theme?: string;
  autoPlay?: boolean;
  [key: string]: unknown;
}

export class CreateVenueDto {
  @ApiProperty({
    description: 'Venue name',
    example: 'The Rock Pub',
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @MinLength(3, { message: 'Venue name must be at least 3 characters' })
  @MaxLength(100, { message: 'Venue name must not exceed 100 characters' })
  name: string;

  @ApiProperty({
    description: 'Unique URL-friendly slug for the venue',
    example: 'the-rock-pub',
    pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$',
  })
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be lowercase alphanumeric with hyphens only',
  })
  @MinLength(3)
  @MaxLength(100)
  slug: string;

  @ApiProperty({
    description: 'Venue owner email address',
    example: 'owner@therockpub.com',
  })
  @IsEmail({}, { message: 'Must be a valid email address' })
  email: string;

  @ApiProperty({
    description: 'Password for venue account',
    example: 'SecurePassword123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain uppercase, lowercase, number, and special character',
  })
  password: string;

  @ApiPropertyOptional({
    description: 'Venue settings (JSON)',
    example: { theme: 'dark', autoPlay: true },
  })
  @IsOptional()
  @IsObject()
  settings?: VenueSettings;
}
