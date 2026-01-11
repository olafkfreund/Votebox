import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateVenueDto } from './create-venue.dto';

export class UpdateVenueDto extends PartialType(OmitType(CreateVenueDto, ['password'] as const)) {}
