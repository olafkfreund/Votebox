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
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventResponseDto } from './dto/event-response.dto';

@ApiTags('Events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new event',
    description: 'Create a new music voting event for a venue',
  })
  @ApiResponse({
    status: 201,
    description: 'Event successfully created',
    type: EventResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Venue not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid time range or event data',
  })
  @ApiResponse({
    status: 409,
    description: 'Event overlaps with existing event',
  })
  create(@Body() createEventDto: CreateEventDto) {
    return this.eventsService.create(createEventDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all events',
    description: 'Retrieve a list of all events. Optionally filter by venue or status.',
  })
  @ApiQuery({
    name: 'venueId',
    required: false,
    description: 'Filter by venue ID',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['UPCOMING', 'ACTIVE', 'ENDED', 'CANCELLED'],
    description: 'Filter by event status',
  })
  @ApiResponse({
    status: 200,
    description: 'List of events',
    type: [EventResponseDto],
  })
  findAll(@Query('venueId') venueId?: string, @Query('status') status?: string) {
    return this.eventsService.findAll(venueId, status);
  }

  @Get('active')
  @ApiOperation({
    summary: 'Get all active events',
    description: 'Retrieve all currently active events across all venues',
  })
  @ApiResponse({
    status: 200,
    description: 'List of active events',
    type: [EventResponseDto],
  })
  findActive() {
    return this.eventsService.findActive();
  }

  @Get('upcoming')
  @ApiOperation({
    summary: 'Get upcoming events',
    description: 'Retrieve all upcoming events across all venues',
  })
  @ApiResponse({
    status: 200,
    description: 'List of upcoming events',
    type: [EventResponseDto],
  })
  findUpcoming() {
    return this.eventsService.findUpcoming();
  }

  @Get('venue/:venueId')
  @ApiOperation({
    summary: 'Get all events for a venue',
    description: 'Retrieve all events for a specific venue',
  })
  @ApiParam({
    name: 'venueId',
    description: 'Venue ID',
  })
  @ApiResponse({
    status: 200,
    description: 'List of venue events',
    type: [EventResponseDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Venue not found',
  })
  findByVenue(@Param('venueId') venueId: string) {
    return this.eventsService.findByVenue(venueId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get event by ID',
    description: 'Retrieve detailed information about a specific event',
  })
  @ApiParam({
    name: 'id',
    description: 'Event ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Event details',
    type: EventResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Event not found',
  })
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update event',
    description: 'Update event information (cannot update ended events)',
  })
  @ApiParam({
    name: 'id',
    description: 'Event ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Event successfully updated',
    type: EventResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot update ended event or invalid time range',
  })
  @ApiResponse({
    status: 404,
    description: 'Event not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Event overlaps with existing event',
  })
  update(@Param('id') id: string, @Body() updateEventDto: UpdateEventDto) {
    return this.eventsService.update(id, updateEventDto);
  }

  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Activate event',
    description: 'Change event status from UPCOMING to ACTIVE',
  })
  @ApiParam({
    name: 'id',
    description: 'Event ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Event successfully activated',
    type: EventResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Event is not in UPCOMING status',
  })
  @ApiResponse({
    status: 404,
    description: 'Event not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Venue already has an active event',
  })
  activate(@Param('id') id: string) {
    return this.eventsService.activate(id);
  }

  @Post(':id/end')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'End event',
    description: 'Change event status from ACTIVE to ENDED',
  })
  @ApiParam({
    name: 'id',
    description: 'Event ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Event successfully ended',
    type: EventResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Event is not in ACTIVE status',
  })
  @ApiResponse({
    status: 404,
    description: 'Event not found',
  })
  end(@Param('id') id: string) {
    return this.eventsService.end(id);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancel event',
    description: 'Change event status to CANCELLED',
  })
  @ApiParam({
    name: 'id',
    description: 'Event ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Event successfully cancelled',
    type: EventResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot cancel ended or already cancelled event',
  })
  @ApiResponse({
    status: 404,
    description: 'Event not found',
  })
  cancel(@Param('id') id: string) {
    return this.eventsService.cancel(id);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete event',
    description: 'Delete event (cannot delete active events or events with votes)',
  })
  @ApiParam({
    name: 'id',
    description: 'Event ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Event successfully deleted',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete active event or event with votes',
  })
  @ApiResponse({
    status: 404,
    description: 'Event not found',
  })
  remove(@Param('id') id: string) {
    return this.eventsService.remove(id);
  }
}
