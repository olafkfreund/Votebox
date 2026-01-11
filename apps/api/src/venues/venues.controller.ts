import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { VenuesService } from './venues.service';
import { CreateVenueDto } from './dto/create-venue.dto';
import { UpdateVenueDto } from './dto/update-venue.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { VenueResponseDto } from './dto/venue-response.dto';

@ApiTags('Venues')
@Controller('venues')
export class VenuesController {
  constructor(private readonly venuesService: VenuesService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new venue',
    description: 'Register a new venue with email, password, and basic information',
  })
  @ApiResponse({
    status: 201,
    description: 'Venue successfully created',
    type: VenueResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Email or slug already exists',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  create(@Body() createVenueDto: CreateVenueDto) {
    return this.venuesService.create(createVenueDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all venues',
    description: 'Retrieve a list of all venues. Optionally include inactive venues.',
  })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'Include inactive venues in the results',
  })
  @ApiResponse({
    status: 200,
    description: 'List of venues',
    type: [VenueResponseDto],
  })
  findAll(@Query('includeInactive') includeInactive?: string) {
    return this.venuesService.findAll(includeInactive === 'true');
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get venue by ID',
    description: 'Retrieve detailed information about a specific venue',
  })
  @ApiParam({
    name: 'id',
    description: 'Venue ID',
    example: 'clu123abc456',
  })
  @ApiResponse({
    status: 200,
    description: 'Venue details',
    type: VenueResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Venue not found',
  })
  findOne(@Param('id') id: string) {
    return this.venuesService.findOne(id);
  }

  @Get('slug/:slug')
  @ApiOperation({
    summary: 'Get venue by slug',
    description: 'Retrieve venue information using its unique slug',
  })
  @ApiParam({
    name: 'slug',
    description: 'Venue slug',
    example: 'the-rock-pub',
  })
  @ApiResponse({
    status: 200,
    description: 'Venue details',
    type: VenueResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Venue not found',
  })
  findBySlug(@Param('slug') slug: string) {
    return this.venuesService.findBySlug(slug);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update venue',
    description: 'Update venue information (name, email, slug, settings)',
  })
  @ApiParam({
    name: 'id',
    description: 'Venue ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Venue successfully updated',
    type: VenueResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Venue not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Email or slug already exists',
  })
  update(@Param('id') id: string, @Body() updateVenueDto: UpdateVenueDto) {
    return this.venuesService.update(id, updateVenueDto);
  }

  @Patch(':id/password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update venue password',
    description: 'Change venue account password (requires current password)',
  })
  @ApiParam({
    name: 'id',
    description: 'Venue ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Password successfully updated',
  })
  @ApiResponse({
    status: 401,
    description: 'Current password is incorrect',
  })
  @ApiResponse({
    status: 404,
    description: 'Venue not found',
  })
  updatePassword(@Param('id') id: string, @Body() updatePasswordDto: UpdatePasswordDto) {
    return this.venuesService.updatePassword(id, updatePasswordDto);
  }

  @Patch(':id/deactivate')
  @ApiOperation({
    summary: 'Deactivate venue',
    description: 'Temporarily deactivate a venue account',
  })
  @ApiParam({
    name: 'id',
    description: 'Venue ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Venue successfully deactivated',
    type: VenueResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Venue not found',
  })
  deactivate(@Param('id') id: string) {
    return this.venuesService.deactivate(id);
  }

  @Patch(':id/activate')
  @ApiOperation({
    summary: 'Activate venue',
    description: 'Reactivate a deactivated venue account',
  })
  @ApiParam({
    name: 'id',
    description: 'Venue ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Venue successfully activated',
    type: VenueResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Venue not found',
  })
  activate(@Param('id') id: string) {
    return this.venuesService.activate(id);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete venue (soft delete)',
    description: 'Deactivate a venue. Cannot delete venues with active events.',
  })
  @ApiParam({
    name: 'id',
    description: 'Venue ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Venue successfully deleted (deactivated)',
    type: VenueResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete venue with active events',
  })
  @ApiResponse({
    status: 404,
    description: 'Venue not found',
  })
  remove(@Param('id') id: string) {
    return this.venuesService.remove(id);
  }
}
