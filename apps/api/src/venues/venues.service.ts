import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVenueDto } from './dto/create-venue.dto';
import { UpdateVenueDto } from './dto/update-venue.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class VenuesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createVenueDto: CreateVenueDto) {
    const { password, ...venueData } = createVenueDto;

    // Check if email or slug already exists
    const existingVenue = await this.prisma.venue.findFirst({
      where: {
        OR: [{ email: venueData.email }, { slug: venueData.slug }],
      },
    });

    if (existingVenue) {
      if (existingVenue.email === venueData.email) {
        throw new ConflictException('Email already registered');
      }
      if (existingVenue.slug === venueData.slug) {
        throw new ConflictException('Slug already taken');
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create venue
    const venue = await this.prisma.venue.create({
      data: {
        ...venueData,
        hashedPassword,
        settings: (venueData.settings || {}) as Prisma.InputJsonValue,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        email: true,
        spotifyAccountId: true,
        settings: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
    });

    return venue;
  }

  async findAll(includeInactive = false) {
    const venues = await this.prisma.venue.findMany({
      where: includeInactive ? {} : { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        email: true,
        spotifyAccountId: true,
        settings: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        _count: {
          select: {
            events: true,
            users: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return venues;
  }

  async findOne(id: string) {
    const venue = await this.prisma.venue.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        email: true,
        spotifyAccountId: true,
        settings: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        _count: {
          select: {
            events: true,
            users: true,
          },
        },
      },
    });

    if (!venue) {
      throw new NotFoundException(`Venue with ID ${id} not found`);
    }

    return venue;
  }

  async findBySlug(slug: string) {
    const venue = await this.prisma.venue.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        email: true,
        spotifyAccountId: true,
        settings: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
    });

    if (!venue) {
      throw new NotFoundException(`Venue with slug '${slug}' not found`);
    }

    return venue;
  }

  async findByEmail(email: string) {
    const venue = await this.prisma.venue.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        slug: true,
        email: true,
        hashedPassword: true,
        spotifyAccountId: true,
        settings: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
    });

    return venue;
  }

  async update(id: string, updateVenueDto: UpdateVenueDto) {
    // Verify venue exists
    await this.findOne(id);

    // Check for email or slug conflicts
    if (updateVenueDto.email || updateVenueDto.slug) {
      const conflictVenue = await this.prisma.venue.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                updateVenueDto.email ? { email: updateVenueDto.email } : {},
                updateVenueDto.slug ? { slug: updateVenueDto.slug } : {},
              ],
            },
          ],
        },
      });

      if (conflictVenue) {
        if (conflictVenue.email === updateVenueDto.email) {
          throw new ConflictException('Email already registered');
        }
        if (conflictVenue.slug === updateVenueDto.slug) {
          throw new ConflictException('Slug already taken');
        }
      }
    }

    // Update venue
    const { settings, ...rest } = updateVenueDto;
    const venue = await this.prisma.venue.update({
      where: { id },
      data: {
        ...rest,
        ...(settings && { settings: settings as Prisma.InputJsonValue }),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        email: true,
        spotifyAccountId: true,
        settings: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
    });

    return venue;
  }

  async updatePassword(id: string, updatePasswordDto: UpdatePasswordDto) {
    // Get venue with password
    const venue = await this.prisma.venue.findUnique({
      where: { id },
      select: {
        id: true,
        hashedPassword: true,
      },
    });

    if (!venue) {
      throw new NotFoundException(`Venue with ID ${id} not found`);
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      updatePasswordDto.currentPassword,
      venue.hashedPassword
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(updatePasswordDto.newPassword, 10);

    // Update password
    await this.prisma.venue.update({
      where: { id },
      data: { hashedPassword },
    });

    return { message: 'Password updated successfully' };
  }

  async deactivate(id: string) {
    await this.findOne(id);

    const venue = await this.prisma.venue.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        name: true,
        slug: true,
        email: true,
        spotifyAccountId: true,
        settings: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
    });

    return venue;
  }

  async activate(id: string) {
    await this.findOne(id);

    const venue = await this.prisma.venue.update({
      where: { id },
      data: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        email: true,
        spotifyAccountId: true,
        settings: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
    });

    return venue;
  }

  async remove(id: string) {
    await this.findOne(id);

    // Check if venue has active events
    const activeEventsCount = await this.prisma.event.count({
      where: {
        venueId: id,
        status: 'ACTIVE',
      },
    });

    if (activeEventsCount > 0) {
      throw new BadRequestException(
        'Cannot delete venue with active events. Please end all active events first.'
      );
    }

    // Soft delete by deactivating
    return this.deactivate(id);
  }

  async hardDelete(id: string) {
    await this.findOne(id);

    await this.prisma.venue.delete({
      where: { id },
    });

    return { message: 'Venue permanently deleted' };
  }

  async updateLastLogin(id: string) {
    await this.prisma.venue.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }
}
