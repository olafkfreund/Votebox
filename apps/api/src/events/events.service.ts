import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createEventDto: CreateEventDto) {
    // Verify venue exists
    const venue = await this.prisma.venue.findUnique({
      where: { id: createEventDto.venueId },
    });

    if (!venue) {
      throw new NotFoundException(`Venue with ID ${createEventDto.venueId} not found`);
    }

    // Validate time range
    const startTime = new Date(createEventDto.startTime);
    const endTime = new Date(createEventDto.endTime);

    if (endTime <= startTime) {
      throw new BadRequestException('End time must be after start time');
    }

    // Check for overlapping events for the same venue
    const overlappingEvent = await this.prisma.event.findFirst({
      where: {
        venueId: createEventDto.venueId,
        status: {
          in: ['UPCOMING', 'ACTIVE'],
        },
        OR: [
          {
            AND: [{ startTime: { lte: startTime } }, { endTime: { gte: startTime } }],
          },
          {
            AND: [{ startTime: { lte: endTime } }, { endTime: { gte: endTime } }],
          },
          {
            AND: [{ startTime: { gte: startTime } }, { endTime: { lte: endTime } }],
          },
        ],
      },
    });

    if (overlappingEvent) {
      throw new ConflictException(`Event overlaps with existing event: ${overlappingEvent.name}`);
    }

    // Create event
    const event = await this.prisma.event.create({
      data: {
        venueId: createEventDto.venueId,
        name: createEventDto.name,
        description: createEventDto.description,
        scheduledDate: new Date(createEventDto.scheduledDate),
        startTime,
        endTime,
        timezone: createEventDto.timezone || 'UTC',
        recurrence: createEventDto.recurrence || 'NONE',
        recurrenceEnd: createEventDto.recurrenceEnd ? new Date(createEventDto.recurrenceEnd) : null,
        playlistSource: createEventDto.playlistSource,
        playlistConfig: createEventDto.playlistConfig as Prisma.InputJsonValue,
        votingRules: (createEventDto.votingRules || {}) as Prisma.InputJsonValue,
      },
    });

    return event;
  }

  async findAll(venueId?: string, status?: string) {
    const where: Prisma.EventWhereInput = {};

    if (venueId) {
      where.venueId = venueId;
    }

    if (status) {
      where.status = status as Prisma.EventWhereInput['status'];
    }

    const events = await this.prisma.event.findMany({
      where,
      include: {
        venue: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            votes: true,
            queue: true,
            playHistory: true,
          },
        },
      },
      orderBy: [{ startTime: 'asc' }, { createdAt: 'desc' }],
    });

    return events;
  }

  async findOne(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        venue: {
          select: {
            id: true,
            name: true,
            slug: true,
            email: true,
          },
        },
        _count: {
          select: {
            votes: true,
            queue: true,
            playHistory: true,
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    return event;
  }

  async findByVenue(venueId: string) {
    // Verify venue exists
    const venue = await this.prisma.venue.findUnique({
      where: { id: venueId },
    });

    if (!venue) {
      throw new NotFoundException(`Venue with ID ${venueId} not found`);
    }

    return this.findAll(venueId);
  }

  async findActive() {
    return this.findAll(undefined, 'ACTIVE');
  }

  async findUpcoming() {
    return this.findAll(undefined, 'UPCOMING');
  }

  async update(id: string, updateEventDto: UpdateEventDto) {
    // Verify event exists
    const existingEvent = await this.findOne(id);

    // Cannot update event that has ended
    if (existingEvent.status === 'ENDED') {
      throw new BadRequestException('Cannot update an ended event');
    }

    // Validate time range if provided
    if (updateEventDto.startTime || updateEventDto.endTime) {
      const startTime = updateEventDto.startTime
        ? new Date(updateEventDto.startTime)
        : existingEvent.startTime;
      const endTime = updateEventDto.endTime
        ? new Date(updateEventDto.endTime)
        : existingEvent.endTime;

      if (endTime <= startTime) {
        throw new BadRequestException('End time must be after start time');
      }

      // Check for overlapping events (excluding current event)
      const overlappingEvent = await this.prisma.event.findFirst({
        where: {
          id: { not: id },
          venueId: existingEvent.venueId,
          status: {
            in: ['UPCOMING', 'ACTIVE'],
          },
          OR: [
            {
              AND: [{ startTime: { lte: startTime } }, { endTime: { gte: startTime } }],
            },
            {
              AND: [{ startTime: { lte: endTime } }, { endTime: { gte: endTime } }],
            },
            {
              AND: [{ startTime: { gte: startTime } }, { endTime: { lte: endTime } }],
            },
          ],
        },
      });

      if (overlappingEvent) {
        throw new ConflictException(`Event overlaps with existing event: ${overlappingEvent.name}`);
      }
    }

    // Update event
    const event = await this.prisma.event.update({
      where: { id },
      data: {
        name: updateEventDto.name,
        description: updateEventDto.description,
        scheduledDate: updateEventDto.scheduledDate
          ? new Date(updateEventDto.scheduledDate)
          : undefined,
        startTime: updateEventDto.startTime ? new Date(updateEventDto.startTime) : undefined,
        endTime: updateEventDto.endTime ? new Date(updateEventDto.endTime) : undefined,
        timezone: updateEventDto.timezone,
        recurrence: updateEventDto.recurrence,
        recurrenceEnd: updateEventDto.recurrenceEnd
          ? new Date(updateEventDto.recurrenceEnd)
          : undefined,
        playlistSource: updateEventDto.playlistSource,
        playlistConfig: updateEventDto.playlistConfig as Prisma.InputJsonValue | undefined,
        votingRules: updateEventDto.votingRules as Prisma.InputJsonValue | undefined,
      },
    });

    return event;
  }

  async activate(id: string) {
    const event = await this.findOne(id);

    if (event.status !== 'UPCOMING') {
      throw new BadRequestException(`Cannot activate event with status: ${event.status}`);
    }

    // Check if there's already an active event for this venue
    const activeEvent = await this.prisma.event.findFirst({
      where: {
        venueId: event.venueId,
        status: 'ACTIVE',
      },
    });

    if (activeEvent) {
      throw new ConflictException(`Venue already has an active event: ${activeEvent.name}`);
    }

    const updatedEvent = await this.prisma.event.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        activatedAt: new Date(),
      },
    });

    return updatedEvent;
  }

  async end(id: string) {
    const event = await this.findOne(id);

    if (event.status !== 'ACTIVE') {
      throw new BadRequestException(`Cannot end event with status: ${event.status}`);
    }

    const updatedEvent = await this.prisma.event.update({
      where: { id },
      data: {
        status: 'ENDED',
        endedAt: new Date(),
      },
    });

    return updatedEvent;
  }

  async cancel(id: string) {
    const event = await this.findOne(id);

    if (event.status === 'ENDED') {
      throw new BadRequestException('Cannot cancel an ended event');
    }

    if (event.status === 'CANCELLED') {
      throw new BadRequestException('Event is already cancelled');
    }

    const updatedEvent = await this.prisma.event.update({
      where: { id },
      data: {
        status: 'CANCELLED',
      },
    });

    return updatedEvent;
  }

  async remove(id: string) {
    const event = await this.findOne(id);

    // Cannot delete active events
    if (event.status === 'ACTIVE') {
      throw new BadRequestException('Cannot delete an active event. Please end it first.');
    }

    // Check if event has votes
    const votesCount = await this.prisma.vote.count({
      where: { eventId: id },
    });

    if (votesCount > 0) {
      throw new BadRequestException(
        'Cannot delete event with existing votes. Please cancel it instead.'
      );
    }

    await this.prisma.event.delete({
      where: { id },
    });

    return { message: 'Event deleted successfully' };
  }

  async updateStats(
    id: string,
    stats: {
      totalVotes?: number;
      totalTracks?: number;
      uniqueVoters?: number;
    }
  ) {
    const event = await this.prisma.event.update({
      where: { id },
      data: stats,
    });

    return event;
  }

  async updateCurrentTrack(id: string, trackId: string | null, startedAt?: Date) {
    const event = await this.prisma.event.update({
      where: { id },
      data: {
        currentTrackId: trackId,
        currentTrackStartedAt: trackId ? startedAt || new Date() : null,
      },
    });

    return event;
  }

  async setSpotifyDevice(id: string, deviceId: string) {
    const event = await this.prisma.event.update({
      where: { id },
      data: {
        spotifyDeviceId: deviceId,
      },
    });

    return event;
  }
}
