import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Guest Voting Flow
 *
 * Tests the complete guest voting experience from landing on the event page
 * to voting for tracks and seeing real-time queue updates.
 */

test.describe('Guest Voting Flow', () => {
  let eventId: string;
  let venueId: string;

  test.beforeAll(async ({ request }) => {
    // Create a test venue
    const venueResponse = await request.post('http://localhost:4000/api/v1/venues', {
      data: {
        name: 'E2E Test Venue',
        slug: 'e2e-test-venue',
        description: 'Test venue for E2E tests',
        address: '123 Test St',
        email: 'test@votebox.com',
        timezone: 'America/New_York',
        spotifyAccountEmail: 'spotify@votebox.com',
      },
    });

    expect(venueResponse.ok()).toBeTruthy();
    const venue = await venueResponse.json();
    venueId = venue.id;

    // Create an active test event
    const eventResponse = await request.post(
      `http://localhost:4000/api/v1/venues/${venueId}/events`,
      {
        data: {
          name: 'E2E Test Event',
          description: 'Test event for E2E tests',
          scheduledStart: new Date().toISOString(),
          scheduledEnd: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
          genres: ['rock', 'metal'],
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
    // Cleanup: Delete event and venue
    if (eventId) {
      await request.delete(`http://localhost:4000/api/v1/events/${eventId}`);
    }
    if (venueId) {
      await request.delete(`http://localhost:4000/api/v1/venues/${venueId}`);
    }
  });

  test('should load event voting page successfully', async ({ page }) => {
    await page.goto(`/v/e2e-test-venue/event/${eventId}`);

    // Check page loaded
    await expect(page).toHaveTitle(/Votebox/);

    // Check event name is displayed
    await expect(page.getByText('E2E Test Event')).toBeVisible();

    // Check voting instructions
    await expect(page.getByText(/Vote for tracks you want to hear/i)).toBeVisible();

    // Check remaining votes display
    await expect(page.getByText(/3\/3 votes/)).toBeVisible();
    await expect(page.getByText(/remaining this hour/i)).toBeVisible();
  });

  test('should show connection status', async ({ page }) => {
    await page.goto(`/v/e2e-test-venue/event/${eventId}`);

    // Check for connection indicator
    const connectionStatus = page.locator('[data-testid="connection-status"]');
    await expect(connectionStatus).toBeVisible();

    // Should eventually show connected
    await expect(connectionStatus).toContainText(/connected/i, { timeout: 5000 });
  });

  test('should display empty queue initially', async ({ page }) => {
    await page.goto(`/v/e2e-test-venue/event/${eventId}`);

    // Queue list should be visible but empty
    const queueList = page.locator('[data-testid="queue-list"]');
    await expect(queueList).toBeVisible();

    // Should show "no tracks" message
    await expect(page.getByText(/no tracks in queue/i)).toBeVisible();
  });

  test('should display now playing section', async ({ page }) => {
    await page.goto(`/v/e2e-test-venue/event/${eventId}`);

    // Now playing section should be visible
    const nowPlaying = page.locator('[data-testid="now-playing"]');
    await expect(nowPlaying).toBeVisible();

    // Should show "no track playing" initially
    await expect(nowPlaying.getByText(/no track playing/i)).toBeVisible();
  });

  test('should search for tracks', async ({ page }) => {
    await page.goto(`/v/e2e-test-venue/event/${eventId}`);

    // Find search input
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();

    // Type search query
    await searchInput.fill('Sleep Dopesmoker');
    await searchInput.press('Enter');

    // Wait for search results
    await page.waitForTimeout(1000); // Debounce delay

    // Should show loading or results
    const trackBrowser = page.locator('[data-testid="track-browser"]');
    await expect(trackBrowser).toBeVisible();
  });

  test('should vote for a track', async ({ page, request }) => {
    await page.goto(`/v/e2e-test-venue/event/${eventId}`);

    // Add a mock track directly via API for testing
    const trackData = {
      trackId: 'test-track-123',
      trackUri: 'spotify:track:test-track-123',
      trackName: 'Test Track',
      artistName: 'Test Artist',
      albumName: 'Test Album',
      albumArt: 'https://example.com/art.jpg',
      duration: 180000,
      addedBy: 'test-session-123',
    };

    const voteResponse = await request.post(
      `http://localhost:4000/api/v1/events/${eventId}/queue`,
      {
        data: trackData,
        headers: {
          'x-forwarded-for': '192.168.1.100',
        },
      }
    );

    expect(voteResponse.ok()).toBeTruthy();

    // Reload page to see the update
    await page.reload();

    // Queue should now show 1 track
    await expect(page.getByText('Test Track')).toBeVisible();
    await expect(page.getByText('Test Artist')).toBeVisible();

    // Vote count should be 1
    await expect(page.getByText(/1 vote/i)).toBeVisible();

    // Remaining votes should be 2
    await expect(page.getByText(/2\/3 votes/)).toBeVisible();
  });

  test('should show error when vote limit exceeded', async ({ page, request }) => {
    await page.goto(`/v/e2e-test-venue/event/${eventId}`);

    const sessionId = 'rate-limit-test-session';

    // Vote 3 times (max limit)
    for (let i = 0; i < 3; i++) {
      const voteResponse = await request.post(
        `http://localhost:4000/api/v1/events/${eventId}/queue`,
        {
          data: {
            trackId: `test-track-${i}`,
            trackUri: `spotify:track:test-track-${i}`,
            trackName: `Test Track ${i}`,
            artistName: 'Test Artist',
            albumName: 'Test Album',
            albumArt: 'https://example.com/art.jpg',
            duration: 180000,
            addedBy: sessionId,
          },
          headers: {
            'x-forwarded-for': '192.168.1.200',
          },
        }
      );

      expect(voteResponse.ok()).toBeTruthy();
      await page.waitForTimeout(100);
    }

    // Try to vote a 4th time (should fail)
    const failedVote = await request.post(`http://localhost:4000/api/v1/events/${eventId}/queue`, {
      data: {
        trackId: 'test-track-4',
        trackUri: 'spotify:track:test-track-4',
        trackName: 'Test Track 4',
        artistName: 'Test Artist',
        albumName: 'Test Album',
        albumArt: 'https://example.com/art.jpg',
        duration: 180000,
        addedBy: sessionId,
      },
      headers: {
        'x-forwarded-for': '192.168.1.200',
      },
    });

    // Should return 429 (Too Many Requests)
    expect(failedVote.status()).toBe(429);

    const errorBody = await failedVote.json();
    expect(errorBody.message).toContain('votes');
  });

  test('should show error when voting too quickly', async ({ page, request }) => {
    const sessionId = 'cooldown-test-session';

    // First vote
    const firstVote = await request.post(`http://localhost:4000/api/v1/events/${eventId}/queue`, {
      data: {
        trackId: 'cooldown-track-1',
        trackUri: 'spotify:track:cooldown-track-1',
        trackName: 'Cooldown Track 1',
        artistName: 'Test Artist',
        albumName: 'Test Album',
        albumArt: 'https://example.com/art.jpg',
        duration: 180000,
        addedBy: sessionId,
      },
      headers: {
        'x-forwarded-for': '192.168.1.300',
      },
    });

    expect(firstVote.ok()).toBeTruthy();

    // Immediate second vote (should fail due to 30-second cooldown)
    const secondVote = await request.post(`http://localhost:4000/api/v1/events/${eventId}/queue`, {
      data: {
        trackId: 'cooldown-track-2',
        trackUri: 'spotify:track:cooldown-track-2',
        trackName: 'Cooldown Track 2',
        artistName: 'Test Artist',
        albumName: 'Test Album',
        albumArt: 'https://example.com/art.jpg',
        duration: 180000,
        addedBy: sessionId,
      },
      headers: {
        'x-forwarded-for': '192.168.1.300',
      },
    });

    expect(secondVote.status()).toBe(429);

    const errorBody = await secondVote.json();
    expect(errorBody.message).toMatch(/wait.*seconds/i);
  });

  test('should display queue ordered by score', async ({ page, request }) => {
    await page.goto(`/v/e2e-test-venue/event/${eventId}`);

    // Add multiple tracks with different vote counts
    const tracks = [
      { name: 'Low Score Track', votes: 1 },
      { name: 'High Score Track', votes: 5 },
      { name: 'Medium Score Track', votes: 3 },
    ];

    for (const track of tracks) {
      for (let i = 0; i < track.votes; i++) {
        await request.post(`http://localhost:4000/api/v1/events/${eventId}/queue`, {
          data: {
            trackId: `track-${track.name}`,
            trackUri: `spotify:track:track-${track.name}`,
            trackName: track.name,
            artistName: 'Test Artist',
            albumName: 'Test Album',
            albumArt: 'https://example.com/art.jpg',
            duration: 180000,
            addedBy: `session-${i}`,
          },
          headers: {
            'x-forwarded-for': `192.168.1.${100 + i}`,
          },
        });
        await page.waitForTimeout(100);
      }
    }

    // Reload to see ordered queue
    await page.reload();
    await page.waitForTimeout(500);

    // Get all track names in order
    const queueItems = page.locator('[data-testid="queue-item"]');
    const trackNames = await queueItems.allTextContents();

    // First should be "High Score Track" (5 votes)
    expect(trackNames[0]).toContain('High Score Track');
  });

  test('should handle WebSocket reconnection', async ({ page }) => {
    await page.goto(`/v/e2e-test-venue/event/${eventId}`);

    // Wait for initial connection
    const connectionStatus = page.locator('[data-testid="connection-status"]');
    await expect(connectionStatus).toContainText(/connected/i, { timeout: 5000 });

    // Simulate network interruption by navigating away and back
    await page.goto('about:blank');
    await page.waitForTimeout(1000);
    await page.goto(`/v/e2e-test-venue/event/${eventId}`);

    // Should reconnect
    await expect(connectionStatus).toContainText(/connected/i, { timeout: 10000 });
  });
});
