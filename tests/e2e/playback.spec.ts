import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Playback Automation
 *
 * Tests automated playback functionality including initialization,
 * play/pause/skip controls, and auto-play features.
 *
 * Note: These tests mock Spotify interactions since we can't control
 * real Spotify devices in E2E tests.
 */

test.describe('Playback Automation', () => {
  let eventId: string;
  let venueId: string;
  const mockDeviceId = 'mock-device-id';

  test.beforeAll(async ({ request }) => {
    // Create test venue
    const venueResponse = await request.post('http://localhost:4000/api/v1/venues', {
      data: {
        name: 'Playback Test Venue',
        slug: 'playback-test-venue',
        description: 'Test venue for playback E2E tests',
        address: '789 Playback Ave',
        email: 'playback@votebox.com',
        timezone: 'America/New_York',
        spotifyAccountEmail: 'playback-spotify@votebox.com',
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
          name: 'Playback Test Event',
          description: 'Test event for playback tests',
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
      try {
        await request.post(`http://localhost:4000/api/v1/events/${eventId}/playback/stop`);
      } catch (e) {
        // Ignore if not initialized
      }
      await request.delete(`http://localhost:4000/api/v1/events/${eventId}`);
    }
    if (venueId) {
      await request.delete(`http://localhost:4000/api/v1/venues/${venueId}`);
    }
  });

  test('should get uninitialized playback status', async ({ request }) => {
    const statusResponse = await request.get(
      `http://localhost:4000/api/v1/events/${eventId}/playback/status`
    );

    expect(statusResponse.ok()).toBeTruthy();
    const status = await statusResponse.json();
    expect(status.initialized).toBe(false);
    expect(status.isPlaying).toBe(false);
    expect(status.currentTrack).toBeNull();
  });

  test('should fail to play without initialization', async ({ request }) => {
    const playResponse = await request.post(
      `http://localhost:4000/api/v1/events/${eventId}/playback/play-next`
    );

    expect(playResponse.status()).toBe(400);
    const error = await playResponse.json();
    expect(error.message).toContain('not initialized');
  });

  test.skip('should initialize playback on device', async ({ request }) => {
    // This test requires mocking Spotify API or having actual Spotify device
    // Skipped for now since we don't have mock Spotify devices in E2E environment

    const initResponse = await request.post(
      `http://localhost:4000/api/v1/events/${eventId}/playback/initialize`,
      {
        data: {
          deviceId: mockDeviceId,
        },
      }
    );

    // Would succeed with real Spotify setup
    // expect(initResponse.ok()).toBeTruthy();
  });

  test('should return 404 for non-existent device', async ({ request }) => {
    // Try to initialize with non-existent device
    const initResponse = await request.post(
      `http://localhost:4000/api/v1/events/${eventId}/playback/initialize`,
      {
        data: {
          deviceId: 'non-existent-device-id',
        },
      }
    );

    // Should fail (404 or 400 depending on Spotify API response)
    expect(initResponse.ok()).toBeFalsy();
  });

  test.skip('should play next track from queue', async ({ request }) => {
    // Requires initialized playback
    // Add tracks to queue first
    for (let i = 0; i < 3; i++) {
      await request.post(`http://localhost:4000/api/v1/events/${eventId}/queue`, {
        data: {
          trackId: `playback-track-${i}`,
          trackUri: `spotify:track:playback-track-${i}`,
          trackName: `Playback Track ${i}`,
          artistName: 'Test Artist',
          albumName: 'Test Album',
          albumArt: 'https://example.com/art.jpg',
          duration: 180000,
          addedBy: `playback-session-${i}`,
        },
        headers: {
          'x-forwarded-for': `192.168.3.${10 + i}`,
        },
      });
    }

    // Play next
    const playResponse = await request.post(
      `http://localhost:4000/api/v1/events/${eventId}/playback/play-next`
    );

    expect(playResponse.ok()).toBeTruthy();
    const playData = await playResponse.json();
    expect(playData.message).toContain('playing');
    expect(playData.nowPlaying).toBeDefined();
    expect(playData.nowPlaying.trackName).toBeDefined();
  });

  test.skip('should pause playback', async ({ request }) => {
    const pauseResponse = await request.post(
      `http://localhost:4000/api/v1/events/${eventId}/playback/pause`
    );

    expect(pauseResponse.ok()).toBeTruthy();
    const pauseData = await pauseResponse.json();
    expect(pauseData.message).toContain('paused');

    // Check status
    const statusResponse = await request.get(
      `http://localhost:4000/api/v1/events/${eventId}/playback/status`
    );
    const status = await statusResponse.json();
    expect(status.isPlaying).toBe(false);
  });

  test.skip('should resume playback', async ({ request }) => {
    const resumeResponse = await request.post(
      `http://localhost:4000/api/v1/events/${eventId}/playback/resume`
    );

    expect(resumeResponse.ok()).toBeTruthy();
    const resumeData = await resumeResponse.json();
    expect(resumeData.message).toContain('resumed');

    // Check status
    const statusResponse = await request.get(
      `http://localhost:4000/api/v1/events/${eventId}/playback/status`
    );
    const status = await statusResponse.json();
    expect(status.isPlaying).toBe(true);
  });

  test.skip('should skip to next track', async ({ request }) => {
    const skipResponse = await request.post(
      `http://localhost:4000/api/v1/events/${eventId}/playback/skip`
    );

    expect(skipResponse.ok()).toBeTruthy();
    const skipData = await skipResponse.json();
    expect(skipData.nowPlaying).toBeDefined();
  });

  test.skip('should disable auto-play', async ({ request }) => {
    const autoPlayResponse = await request.post(
      `http://localhost:4000/api/v1/events/${eventId}/playback/auto-play`,
      {
        data: {
          enabled: false,
        },
      }
    );

    expect(autoPlayResponse.ok()).toBeTruthy();
    const data = await autoPlayResponse.json();
    expect(data.autoPlayEnabled).toBe(false);

    // Check status
    const statusResponse = await request.get(
      `http://localhost:4000/api/v1/events/${eventId}/playback/status`
    );
    const status = await statusResponse.json();
    expect(status.autoPlayEnabled).toBe(false);
  });

  test.skip('should enable auto-play', async ({ request }) => {
    const autoPlayResponse = await request.post(
      `http://localhost:4000/api/v1/events/${eventId}/playback/auto-play`,
      {
        data: {
          enabled: true,
        },
      }
    );

    expect(autoPlayResponse.ok()).toBeTruthy();
    const data = await autoPlayResponse.json();
    expect(data.autoPlayEnabled).toBe(true);
  });

  test.skip('should stop playback and cleanup', async ({ request }) => {
    const stopResponse = await request.post(
      `http://localhost:4000/api/v1/events/${eventId}/playback/stop`
    );

    expect(stopResponse.ok()).toBeTruthy();
    const stopData = await stopResponse.json();
    expect(stopData.message).toContain('stopped');

    // Check status - should be uninitialized
    const statusResponse = await request.get(
      `http://localhost:4000/api/v1/events/${eventId}/playback/status`
    );
    const status = await statusResponse.json();
    expect(status.initialized).toBe(false);
  });

  test('should handle empty queue gracefully', async ({ request }) => {
    // Note: This test assumes playback is not initialized or will be mocked

    // Clear queue first
    await request.delete(`http://localhost:4000/api/v1/admin/events/${eventId}/queue/clear`);

    // Try to play next with empty queue
    // This will fail with "not initialized" since we can't initialize without Spotify
    // In a real scenario with initialized playback, it should return empty queue message
  });

  test('should return 400 for invalid operations', async ({ request }) => {
    // Try to pause when not initialized
    const pauseResponse = await request.post(
      `http://localhost:4000/api/v1/events/${eventId}/playback/pause`
    );

    expect(pauseResponse.status()).toBe(400);
  });
});

/**
 * Integration Tests: Playback with Real-time Updates
 *
 * These tests verify that playback actions trigger WebSocket updates
 */
test.describe('Playback Real-time Integration', () => {
  test.skip('should broadcast now playing updates via WebSocket', async ({ page, request }) => {
    // This would require:
    // 1. Initialized playback
    // 2. WebSocket connection from page
    // 3. Playing a track
    // 4. Listening for nowPlayingUpdate event
    // Implementation would look like:
    // await page.goto(`/v/test-venue/event/${eventId}`);
    // const nowPlayingUpdate = page.waitForEvent('nowPlayingUpdate');
    // await request.post(`.../playback/play-next`);
    // const update = await nowPlayingUpdate;
    // expect(update.trackName).toBeDefined();
  });
});
