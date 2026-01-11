import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { VenuesService } from './venues.service';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('VenuesService', () => {
  let service: VenuesService;

  const mockPrismaService = {
    venue: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    event: {
      count: jest.fn(),
    },
  };

  const mockVenue = {
    id: 'test-id-123',
    name: 'Test Venue',
    slug: 'test-venue',
    email: 'test@venue.com',
    hashedPassword: 'hashed_password',
    spotifyAccountId: null,
    settings: {},
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    lastLoginAt: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VenuesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<VenuesService>(VenuesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createVenueDto = {
      name: 'New Venue',
      slug: 'new-venue',
      email: 'new@venue.com',
      password: 'Password123!',
      settings: { theme: 'dark' },
    };

    it('should create a new venue', async () => {
      mockPrismaService.venue.findFirst.mockResolvedValue(null);
      mockPrismaService.venue.create.mockResolvedValue({
        ...mockVenue,
        name: createVenueDto.name,
        slug: createVenueDto.slug,
        email: createVenueDto.email,
        settings: createVenueDto.settings,
      });
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');

      const result = await service.create(createVenueDto);

      expect(mockPrismaService.venue.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [{ email: createVenueDto.email }, { slug: createVenueDto.slug }],
        },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(createVenueDto.password, 10);
      expect(mockPrismaService.venue.create).toHaveBeenCalled();
      expect(result.email).toBe(createVenueDto.email);
    });

    it('should throw ConflictException if email already exists', async () => {
      mockPrismaService.venue.findFirst.mockResolvedValue({
        ...mockVenue,
        email: createVenueDto.email,
      });

      await expect(service.create(createVenueDto)).rejects.toThrow(
        new ConflictException('Email already registered')
      );
    });

    it('should throw ConflictException if slug already exists', async () => {
      mockPrismaService.venue.findFirst.mockResolvedValue({
        ...mockVenue,
        slug: createVenueDto.slug,
        email: 'different@email.com',
      });

      await expect(service.create(createVenueDto)).rejects.toThrow(
        new ConflictException('Slug already taken')
      );
    });
  });

  describe('findAll', () => {
    it('should return all active venues by default', async () => {
      const mockVenues = [mockVenue, { ...mockVenue, id: 'test-id-456' }];
      mockPrismaService.venue.findMany.mockResolvedValue(mockVenues);

      const result = await service.findAll();

      expect(mockPrismaService.venue.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        select: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockVenues);
    });

    it('should include inactive venues when requested', async () => {
      const mockVenues = [mockVenue, { ...mockVenue, id: 'test-id-456', isActive: false }];
      mockPrismaService.venue.findMany.mockResolvedValue(mockVenues);

      const result = await service.findAll(true);

      expect(mockPrismaService.venue.findMany).toHaveBeenCalledWith({
        where: {},
        select: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockVenues);
    });
  });

  describe('findOne', () => {
    it('should return a venue by id', async () => {
      mockPrismaService.venue.findUnique.mockResolvedValue(mockVenue);

      const result = await service.findOne(mockVenue.id);

      expect(mockPrismaService.venue.findUnique).toHaveBeenCalledWith({
        where: { id: mockVenue.id },
        select: expect.any(Object),
      });
      expect(result).toEqual(mockVenue);
    });

    it('should throw NotFoundException if venue not found', async () => {
      mockPrismaService.venue.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        new NotFoundException('Venue with ID non-existent not found')
      );
    });
  });

  describe('findBySlug', () => {
    it('should return a venue by slug', async () => {
      mockPrismaService.venue.findUnique.mockResolvedValue(mockVenue);

      const result = await service.findBySlug(mockVenue.slug);

      expect(mockPrismaService.venue.findUnique).toHaveBeenCalledWith({
        where: { slug: mockVenue.slug },
        select: expect.any(Object),
      });
      expect(result).toEqual(mockVenue);
    });

    it('should throw NotFoundException if venue not found', async () => {
      mockPrismaService.venue.findUnique.mockResolvedValue(null);

      await expect(service.findBySlug('non-existent')).rejects.toThrow(
        new NotFoundException("Venue with slug 'non-existent' not found")
      );
    });
  });

  describe('update', () => {
    const updateDto = {
      name: 'Updated Name',
      settings: { theme: 'light' },
    };

    it('should update a venue', async () => {
      mockPrismaService.venue.findUnique.mockResolvedValue(mockVenue);
      mockPrismaService.venue.update.mockResolvedValue({
        ...mockVenue,
        ...updateDto,
      });

      const result = await service.update(mockVenue.id, updateDto);

      expect(mockPrismaService.venue.update).toHaveBeenCalledWith({
        where: { id: mockVenue.id },
        data: updateDto,
        select: expect.any(Object),
      });
      expect(result.name).toBe(updateDto.name);
    });

    it('should throw ConflictException if email conflict', async () => {
      mockPrismaService.venue.findUnique.mockResolvedValue(mockVenue);
      mockPrismaService.venue.findFirst.mockResolvedValue({
        ...mockVenue,
        id: 'different-id',
      });

      await expect(service.update(mockVenue.id, { email: 'taken@email.com' })).rejects.toThrow(
        new ConflictException('Email already registered')
      );
    });
  });

  describe('updatePassword', () => {
    const updatePasswordDto = {
      currentPassword: 'OldPassword123!',
      newPassword: 'NewPassword123!',
    };

    it('should update password successfully', async () => {
      mockPrismaService.venue.findUnique.mockResolvedValue(mockVenue);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new_hashed_password');
      mockPrismaService.venue.update.mockResolvedValue(mockVenue);

      const result = await service.updatePassword(mockVenue.id, updatePasswordDto);

      expect(bcrypt.compare).toHaveBeenCalledWith(
        updatePasswordDto.currentPassword,
        mockVenue.hashedPassword
      );
      expect(bcrypt.hash).toHaveBeenCalledWith(updatePasswordDto.newPassword, 10);
      expect(mockPrismaService.venue.update).toHaveBeenCalled();
      expect(result.message).toBe('Password updated successfully');
    });

    it('should throw UnauthorizedException if current password is incorrect', async () => {
      mockPrismaService.venue.findUnique.mockResolvedValue(mockVenue);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.updatePassword(mockVenue.id, updatePasswordDto)).rejects.toThrow(
        new UnauthorizedException('Current password is incorrect')
      );
    });
  });

  describe('deactivate', () => {
    it('should deactivate a venue', async () => {
      mockPrismaService.venue.findUnique.mockResolvedValue(mockVenue);
      mockPrismaService.venue.update.mockResolvedValue({
        ...mockVenue,
        isActive: false,
      });

      const result = await service.deactivate(mockVenue.id);

      expect(mockPrismaService.venue.update).toHaveBeenCalledWith({
        where: { id: mockVenue.id },
        data: { isActive: false },
        select: expect.any(Object),
      });
      expect(result.isActive).toBe(false);
    });
  });

  describe('activate', () => {
    it('should activate a venue', async () => {
      mockPrismaService.venue.findUnique.mockResolvedValue({
        ...mockVenue,
        isActive: false,
      });
      mockPrismaService.venue.update.mockResolvedValue(mockVenue);

      const result = await service.activate(mockVenue.id);

      expect(mockPrismaService.venue.update).toHaveBeenCalledWith({
        where: { id: mockVenue.id },
        data: { isActive: true },
        select: expect.any(Object),
      });
      expect(result.isActive).toBe(true);
    });
  });

  describe('remove', () => {
    it('should soft delete a venue (deactivate)', async () => {
      mockPrismaService.venue.findUnique.mockResolvedValue(mockVenue);
      mockPrismaService.event.count.mockResolvedValue(0);
      mockPrismaService.venue.update.mockResolvedValue({
        ...mockVenue,
        isActive: false,
      });

      const result = await service.remove(mockVenue.id);

      expect(mockPrismaService.event.count).toHaveBeenCalledWith({
        where: { venueId: mockVenue.id, status: 'ACTIVE' },
      });
      expect(result.isActive).toBe(false);
    });

    it('should throw BadRequestException if venue has active events', async () => {
      mockPrismaService.venue.findUnique.mockResolvedValue(mockVenue);
      mockPrismaService.event.count.mockResolvedValue(2);

      await expect(service.remove(mockVenue.id)).rejects.toThrow(
        new BadRequestException(
          'Cannot delete venue with active events. Please end all active events first.'
        )
      );
    });
  });

  describe('hardDelete', () => {
    it('should permanently delete a venue', async () => {
      mockPrismaService.venue.findUnique.mockResolvedValue(mockVenue);
      mockPrismaService.venue.delete.mockResolvedValue(mockVenue);

      const result = await service.hardDelete(mockVenue.id);

      expect(mockPrismaService.venue.delete).toHaveBeenCalledWith({
        where: { id: mockVenue.id },
      });
      expect(result.message).toBe('Venue permanently deleted');
    });
  });

  describe('updateLastLogin', () => {
    it('should update last login timestamp', async () => {
      mockPrismaService.venue.update.mockResolvedValue(mockVenue);

      await service.updateLastLogin(mockVenue.id);

      expect(mockPrismaService.venue.update).toHaveBeenCalledWith({
        where: { id: mockVenue.id },
        data: { lastLoginAt: expect.any(Date) },
      });
    });
  });
});
