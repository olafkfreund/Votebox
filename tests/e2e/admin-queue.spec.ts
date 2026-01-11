import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Admin Queue Management
 *
 * Tests admin-only queue control endpoints including emergency clear,
 * force skip, track removal, and score recalculation.
 */

test.describe('Admin Queue Management', () => {
  let eventId: string;
  let venueId: string;

  test.beforeAll(async ({ request }) => {
    // Create test venue
    const venueResponse = await request.post('http://localhost:4000/api/v1/venues', {
      data: {
        name: 'Admin Test Venue',
        slug: 'admin-test-venue',
        description: 'Test venue for admin E2E tests',
        address: '456 Admin St',
        email: 'admin@votebox.com',
        timezone: 'America/New_York',
        spotifyAccountEmail: 'admin-spotify@votebox.com',
      },
    });

    expect(venueResponse.ok()).toBeTruthy();
    const venue = await venueResponse.json();
    venueId = venue.id;

    // Create active event
    const eventResponse = await request.post(
      `http://localhost:4000/api/v1/venues/${venueId}/events`,
      {
        data: {
          name: 'Admin Test Event',
          description: 'Test event for admin tests',
          scheduledStart: new Date().toISOString(),
          scheduledEnd: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
          genres: ['rock'],
          votingEnabled: true,
          maxVotesPerUser: 3,
        },
      }
    );

    expect(eventResponse.ok()).toBeTruthy();
    const event = await eventResponse.json();
    eventId = event.id;

    // Start the event
    await request.post(`http://localhost:4000/api/v1/events/${eventId}/start`);
  });

  test.afterAll(async ({ request }) => {
    // Cleanup
    if (eventId) {
      await request.delete(`http://localhost:4000/api/v1/events/${eventId}`);
    }
    if (venueId) {
      await request.delete(`http://localhost:4000/api/v1/venues/${venueId}`);
    }
  });

  test('should clear entire queue', async ({ request }) => {
    // Add multiple tracks to queue
    for (let i = 0; i < 5; i++) {
      await request.post(`http://localhost:4000/api/v1/events/${eventId}/queue`, {
        data: {
          trackId: `clear-test-track-${i}`,
          trackUri: `spotify:track:clear-test-track-${i}`,
          trackName: `Clear Test Track ${i}`,
          artistName: 'Test Artist',
          albumName: 'Test Album',
          albumArt: 'https://example.com/art.jpg',
          duration: 180000,
          addedBy: `session-${i}`,
        },
        headers: {
          'x-forwarded-for': `192.168.2.${10 + i}`,
        },
      });
    }

    // Verify queue has tracks
    const queueBefore = await request.get(`http://localhost:4000/api/v1/events/${eventId}/queue`);
    const queueDataBefore = await queueBefore.json();
    expect(queueDataBefore.length).toBeGreaterThan(0);

    // Clear queue (admin endpoint)
    const clearResponse = await request.delete(
      `http://localhost:4000/api/v1/admin/events/${eventId}/queue/clear`
    );

    expect(clearResponse.ok()).toBeTruthy();
    const clearData = await clearResponse.json();
    expect(clearData.message).toContain('cleared successfully');
    expect(clearData.deletedCount).toBeGreaterThan(0);

    // Verify queue is empty
    const queueAfter = await request.get(`http://localhost:4000/api/v1/events/${eventId}/queue`);
    const queueDataAfter = await queueAfter.json();
    expect(queueDataAfter.length).toBe(0);
  });

  test('should force skip a track', async ({ request }) => {
    // Add a track
    const trackId = 'skip-test-track';
    await request.post(`http://localhost:4000/api/v1/events/${eventId}/queue`, {
      data: {
        trackId,
        trackUri: `spotify:track:${trackId}`,
        trackName: 'Skip Test Track',
        artistName: 'Test Artist',
        albumName: 'Test Album',
        albumArt: 'https://example.com/art.jpg',
        duration: 180000,
        addedBy: 'skip-session',
      },
      headers: {
        'x-forwarded-for': '192.168.2.100',
      },
    });

    // Force skip with reason
    const skipResponse = await request.post(
      `http://localhost:4000/api/v1/admin/events/${eventId}/queue/${trackId}/force-skip?reason=inappropriate`
    );

    expect(skipResponse.ok()).toBeTruthy();
    const skipData = await skipResponse.json();
    expect(skipData.skipped).toBe(true);
    expect(skipData.skippedReason).toBe('inappropriate');
    expect(skipData.isPlayed).toBe(true);
  });

  test('should remove track from queue', async ({ request }) => {
    // Add a track
    const trackId = 'remove-test-track';
    await request.post(`http://localhost:4000/api/v1/events/${eventId}/queue`, {
      data: {
        trackId,
        trackUri: `spotify:track:${trackId}`,
        trackName: 'Remove Test Track',
        artistName: 'Test Artist',
        albumName: 'Test Album',
        albumArt: 'https://example.com/art.jpg',
        duration: 180000,
        addedBy: 'remove-session',
      },
      headers: {
        'x-forwarded-for': '192.168.2.110',
      },
    });

    // Verify track is in queue
    const queueBefore = await request.get(`http://localhost:4000/api/v1/events/${eventId}/queue`);
    const queueDataBefore = await queueBefore.json();
    expect(queueDataBefore.some((item: any) => item.trackId === trackId)).toBe(true);

    // Remove track
    const removeResponse = await request.delete(
      `http://localhost:4000/api/v1/admin/events/${eventId}/queue/${trackId}`
    );

    expect(removeResponse.ok()).toBeTruthy();
    const removeData = await removeResponse.json();
    expect(removeData.message).toContain('removed');

    // Verify track is gone
    const queueAfter = await request.get(`http://localhost:4000/api/v1/events/${eventId}/queue`);
    const queueDataAfter = await queueAfter.json();
    expect(queueDataAfter.some((item: any) => item.trackId === trackId)).toBe(false);
  });

  test('should recalculate all queue scores', async ({ request }) => {
    // Add multiple tracks
    for (let i = 0; i < 3; i++) {
      await request.post(`http://localhost:4000/api/v1/events/${eventId}/queue`, {
        data: {
          trackId: `recalc-track-${i}`,
          trackUri: `spotify:track:recalc-track-${i}`,
          trackName: `Recalc Track ${i}`,
          artistName: 'Test Artist',
          albumName: 'Test Album',
          albumArt: 'https://example.com/art.jpg',
          duration: 180000,
          addedBy: `recalc-session-${i}`,
        },
        headers: {
          'x-forwarded-for': `192.168.2.${120 + i}`,
        },
      });
    }

    // Recalculate scores
    const recalcResponse = await request.post(
      `http://localhost:4000/api/v1/admin/events/${eventId}/queue/recalculate-scores`
    );

    expect(recalcResponse.ok()).toBeTruthy();
    const recalcData = await recalcResponse.json();
    expect(recalcData.message).toContain('recalculated successfully');
    expect(recalcData.updatedCount).toBeGreaterThan(0);
  });

  test('should return 404 for non-existent track', async ({ request }) => {
    const removeResponse = await request.delete(
      `http://localhost:4000/api/v1/admin/events/${eventId}/queue/non-existent-track`
    );

    expect(removeResponse.status()).toBe(404);
  });

  test('should return 404 for non-existent event', async ({ request }) => {
    const clearResponse = await request.delete(
      'http://localhost:4000/api/v1/admin/events/non-existent-event/queue/clear'
    );

    expect(clearResponse.status()).toBe(404);
  });

  test('should get queue statistics', async ({ request }) => {
    // Add and skip some tracks for statistics
    const trackId = 'stats-track-1';
    await request.post(`http://localhost:4000/api/v1/events/${eventId}/queue`, {
      data: {
        trackId,
        trackUri: `spotify:track:${trackId}`,
        trackName: 'Stats Track',
        artistName: 'Test Artist',
        albumName: 'Test Album',
        albumArt: 'https://example.com/art.jpg',
        duration: 180000,
        addedBy: 'stats-session',
      },
      headers: {
        'x-forwarded-for': '192.168.2.200',
      },
    });

    // Skip it
    await request.post(
      `http://localhost:4000/api/v1/admin/events/${eventId}/queue/${trackId}/force-skip`
    );

    // Get statistics
    const statsResponse = await request.get(
      `http://localhost:4000/api/v1/events/${eventId}/queue/stats`
    );

    expect(statsResponse.ok()).toBeTruthy();
    const stats = await statsResponse.json();
    expect(stats).toHaveProperty('totalTracks');
    expect(stats).toHaveProperty('totalVotes');
    expect(stats).toHaveProperty('playedTracks');
    expect(stats).toHaveProperty('skippedTracks');
    expect(stats.skippedTracks).toBeGreaterThan(0);
  });
});
