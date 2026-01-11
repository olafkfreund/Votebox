# Testing Guide

Comprehensive testing documentation for the Votebox project.

---

## Table of Contents

- [Testing Strategy](#testing-strategy)
- [Testing Tools](#testing-tools)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Test Coverage](#test-coverage)
- [CI/CD Integration](#cicd-integration)
- [Best Practices](#best-practices)

---

## Testing Strategy

Votebox follows a multi-layer testing approach:

### 1. Unit Tests

- **Scope**: Individual services, controllers, utilities
- **Framework**: Jest
- **Coverage Target**: 80%+
- **Location**: `*.spec.ts` files alongside source code

### 2. Integration Tests

- **Scope**: API endpoints, database interactions
- **Framework**: Jest + Supertest
- **Coverage**: Critical user flows

### 3. End-to-End Tests

- **Scope**: Complete user journeys
- **Framework**: Playwright
- **Coverage**: Happy paths + critical error cases
- **Location**: `tests/e2e/*.spec.ts`

---

## Testing Tools

### Primary Stack

**Jest** (v29+)

- Test runner
- Assertion library
- Mocking framework
- Coverage reporting

**@nestjs/testing**

- NestJS test utilities
- Dependency injection for tests
- Mock providers

**Supertest** (integration tests)

- HTTP assertions
- API endpoint testing

**Playwright**

- Browser automation
- Real user interaction testing
- Multi-browser support (Chromium, Firefox, WebKit)
- Mobile viewport testing
- Automatic waiting and retry logic

---

## Running Tests

### All Tests

```bash
npm test
```

### Watch Mode (development)

```bash
npm run test:watch
```

### Coverage Report

```bash
npm run test:cov
```

### CI Mode (with coverage)

```bash
npm run test:ci
```

### Specific File

```bash
npm test queue.service.spec.ts
```

### Specific Test Suite

```bash
npm test -- --testNamePattern="VoteTrackerService"
```

### E2E Tests

```bash
# Run all E2E tests (headless)
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in headed mode (see browser)
npm run test:e2e:headed

# View test report
npm run test:e2e:report
```

### Specific E2E Test File

```bash
npx playwright test tests/e2e/guest-voting.spec.ts
```

---

## Writing Tests

### Unit Test Structure

**Location**: `apps/api/src/[module]/[service].spec.ts`

**Template**:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ServiceName } from './service-name.service';
import { DependencyName } from '../dependency/dependency-name.service';

describe('ServiceName', () => {
  let service: ServiceName;
  let dependency: DependencyName;

  const mockDependency = {
    method: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceName,
        {
          provide: DependencyName,
          useValue: mockDependency,
        },
      ],
    }).compile();

    service = module.get<ServiceName>(ServiceName);
    dependency = module.get<DependencyName>(DependencyName);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('methodName', () => {
    it('should perform expected operation', async () => {
      // Arrange
      mockDependency.method.mockResolvedValue(expectedResult);

      // Act
      const result = await service.methodName(input);

      // Assert
      expect(mockDependency.method).toHaveBeenCalledWith(expectedArgs);
      expect(result).toEqual(expectedResult);
    });

    it('should throw error when invalid input', async () => {
      // Arrange & Act & Assert
      await expect(service.methodName(invalidInput)).rejects.toThrow(ExpectedException);
    });
  });
});
```

---

### Example: QueueService Tests

**File**: `apps/api/src/queue/queue.service.spec.ts`

```typescript
describe('QueueService', () => {
  let service: QueueService;
  let prismaService: PrismaService;
  let voteTracker: VoteTrackerService;

  const mockPrismaService = {
    event: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    queueItem: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    $transaction: jest.fn((operations) => Promise.all(operations)),
  };

  const mockWebSocketGateway = {
    emitQueueUpdate: jest.fn(),
    emitVoteUpdate: jest.fn(),
  };

  const mockVoteTracker = {
    checkAndRecordVote: jest.fn(),
    getRemainingVotes: jest.fn().mockReturnValue(3),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: WebSocketGatewayService,
          useValue: mockWebSocketGateway,
        },
        {
          provide: VoteTrackerService,
          useValue: mockVoteTracker,
        },
      ],
    }).compile();

    service = module.get<QueueService>(QueueService);
  });

  describe('addToQueue', () => {
    it('should add new track to queue', async () => {
      mockVoteTracker.checkAndRecordVote.mockResolvedValue(undefined);
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockPrismaService.queueItem.findFirst.mockResolvedValue(null);

      const result = await service.addToQueue('event-123', dto, '192.168.1.1');

      expect(mockVoteTracker.checkAndRecordVote).toHaveBeenCalled();
      expect(result.trackId).toBe(dto.trackId);
    });
  });
});
```

---

### Example: VoteTrackerService Tests

**File**: `apps/api/src/queue/vote-tracker.service.spec.ts`

```typescript
describe('VoteTrackerService', () => {
  let service: VoteTrackerService;

  describe('checkAndRecordVote', () => {
    it('should allow first vote for a session', async () => {
      await expect(
        service.checkAndRecordVote(eventId, trackId, sessionId, ipAddress)
      ).resolves.not.toThrow();
    });

    it('should enforce 30-second vote cooldown', async () => {
      await service.checkAndRecordVote(eventId, trackId, sessionId, ipAddress);

      await expect(
        service.checkAndRecordVote(eventId, 'track-999', sessionId, ipAddress)
      ).rejects.toThrow(/Please wait \d+ seconds before voting again/);
    });

    it('should enforce hourly rate limit (3 votes per hour)', async () => {
      // Test implementation
    });

    it('should enforce 2-hour same-song cooldown', async () => {
      // Test implementation
    });

    it('should enforce IP-based rate limiting', async () => {
      // Test implementation
    });
  });
});
```

---

## Test Coverage

### Current Coverage (Week 4)

**Backend (apps/api)**:

- **Queue Management**: ~85% coverage
  - `queue.service.spec.ts`: 21 tests
  - `vote-tracker.service.spec.ts`: 13 tests
  - `queue.controller`: Not yet tested (integration tests planned)
  - `admin-queue.controller`: Not yet tested (integration tests planned)

- **Event Management**: ~70% coverage
  - Core CRUD operations tested
  - Lifecycle management tested

- **Venue Management**: ~70% coverage
  - CRUD operations tested
  - Validation tested

- **Spotify Integration**: Not yet tested (mocked in integration tests)

**Frontend (apps/web)**:

- **Status**: Not yet implemented
- **Planned**: React Testing Library + Playwright

---

### Coverage Goals

| Component           | Target | Current |
| ------------------- | ------ | ------- |
| Services            | 90%    | 80%     |
| Controllers         | 80%    | 0%      |
| DTOs/Validators     | 100%   | 0%      |
| Utilities           | 90%    | 0%      |
| Frontend Components | 80%    | 0%      |

---

## CI/CD Integration

### GitHub Actions Workflow

**File**: `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    name: Test
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: votebox_test
          POSTGRES_PASSWORD: test_password
          POSTGRES_DB: votebox_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Generate Prisma Client
        run: npx prisma generate --schema=packages/database/prisma/schema.prisma

      - name: Run migrations
        run: npx prisma migrate deploy --schema=packages/database/prisma/schema.prisma
        env:
          DATABASE_URL: postgresql://votebox_test:test_password@localhost:5432/votebox_test

      - name: Run tests
        run: npm run test:ci
        env:
          DATABASE_URL: postgresql://votebox_test:test_password@localhost:5432/votebox_test
          REDIS_URL: redis://localhost:6379

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

---

### Test Environment

**Environment Variables** (`.env.test`):

```env
DATABASE_URL=postgresql://votebox_test:test_password@localhost:5432/votebox_test?schema=public
REDIS_URL=redis://localhost:6379
NODE_ENV=test
```

---

## Best Practices

### 1. Test Naming

Use descriptive test names that explain the scenario:

✅ **Good**:

```typescript
it('should throw BadRequestException when session ID is missing', async () => {
  // ...
});
```

❌ **Bad**:

```typescript
it('should work', async () => {
  // ...
});
```

---

### 2. AAA Pattern

Structure tests using **Arrange, Act, Assert**:

```typescript
it('should add new track to queue', async () => {
  // Arrange
  mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
  mockPrismaService.queueItem.findFirst.mockResolvedValue(null);

  // Act
  const result = await service.addToQueue('event-123', dto, '192.168.1.1');

  // Assert
  expect(result.trackId).toBe(dto.trackId);
  expect(mockPrismaService.queueItem.create).toHaveBeenCalled();
});
```

---

### 3. Mock External Dependencies

Always mock external services and databases:

```typescript
const mockPrismaService = {
  event: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
};

const mockSpotifyClient = {
  search: jest.fn(),
  getTrack: jest.fn(),
};
```

---

### 4. Test Edge Cases

Cover happy paths AND error scenarios:

```typescript
describe('addToQueue', () => {
  it('should add new track successfully', async () => {
    // Happy path
  });

  it('should throw NotFoundException when event not found', async () => {
    // Error case
  });

  it('should throw BadRequestException when event not active', async () => {
    // Business logic error
  });

  it('should handle rate limit errors from vote tracker', async () => {
    // Dependency error
  });
});
```

---

### 5. Clean Up After Tests

```typescript
afterEach(() => {
  jest.clearAllMocks();
});

afterAll(async () => {
  await module.close();
});
```

---

### 6. Use Test Factories

Create reusable test data factories:

```typescript
// test/factories/event.factory.ts
export const createMockEvent = (overrides = {}) => ({
  id: 'event-123',
  venueId: 'venue-123',
  name: 'Doom Rock Night',
  status: 'ACTIVE',
  totalTracks: 0,
  ...overrides,
});

// In tests:
const event = createMockEvent({ status: 'ENDED' });
```

---

### 7. Avoid Test Interdependence

Each test should be independent and runnable in isolation:

❌ **Bad**:

```typescript
let sharedState;

it('test 1', () => {
  sharedState = doSomething();
});

it('test 2', () => {
  expect(sharedState).toBe(expected); // Depends on test 1!
});
```

✅ **Good**:

```typescript
it('test 1', () => {
  const state = doSomething();
  expect(state).toBe(expected);
});

it('test 2', () => {
  const state = doSomething();
  expect(state).toBe(expected);
});
```

---

### 8. Test Async Code Properly

Use `async/await` and proper error assertions:

```typescript
it('should handle async errors', async () => {
  mockService.method.mockRejectedValue(new Error('Async error'));

  await expect(service.doSomething()).rejects.toThrow('Async error');
});
```

---

## Testing Checklist

Before submitting code, ensure:

- [ ] All new code has unit tests
- [ ] Tests follow naming conventions
- [ ] Edge cases are covered
- [ ] Mocks are properly configured
- [ ] Tests are independent
- [ ] Coverage hasn't decreased
- [ ] All tests pass locally
- [ ] CI tests pass

---

## Future Testing Plans

### Week 5-8: Integration Tests

- Controller integration tests
- Database integration tests
- Spotify API integration tests
- WebSocket integration tests

### Week 4: E2E Tests - **COMPLETE**

- ✅ Complete user voting flow
- ✅ Admin queue management
- ✅ Playback automation
- ✅ Multi-user scenarios
- ✅ Error handling flows
- ✅ Rate limiting validation
- ✅ WebSocket reconnection

### Post-MVP: Performance Tests

- Load testing with Artillery
- Stress testing queue operations
- WebSocket connection limits
- Database query optimization

---

## End-to-End Testing with Playwright

### Overview

E2E tests validate complete user journeys through the application, testing both frontend and backend integration.

**Test Files**:

- `tests/e2e/guest-voting.spec.ts` - Guest voting experience
- `tests/e2e/admin-queue.spec.ts` - Admin queue management
- `tests/e2e/playback.spec.ts` - Playback automation

### E2E Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  let eventId: string;

  test.beforeAll(async ({ request }) => {
    // Setup: Create test data via API
    const response = await request.post('http://localhost:4000/api/v1/venues', {
      data: {
        /* venue data */
      },
    });
    // ...
  });

  test.afterAll(async ({ request }) => {
    // Cleanup: Delete test data
  });

  test('should perform user action', async ({ page }) => {
    // Navigate to page
    await page.goto('/path');

    // Interact with elements
    await page.click('[data-testid="button"]');

    // Assert outcome
    await expect(page.getByText('Success')).toBeVisible();
  });
});
```

### Guest Voting Tests

**File**: `tests/e2e/guest-voting.spec.ts` (12 test cases)

Test scenarios:

1. ✅ Load event voting page successfully
2. ✅ Show connection status (WebSocket)
3. ✅ Display empty queue initially
4. ✅ Display now playing section
5. ✅ Search for tracks
6. ✅ Vote for a track
7. ✅ Show error when vote limit exceeded (rate limiting)
8. ✅ Show error when voting too quickly (30s cooldown)
9. ✅ Display queue ordered by score
10. ✅ Handle WebSocket reconnection
11. ✅ Track remaining votes (3/3 → 2/3 → 1/3)
12. ✅ Real-time queue updates

### Admin Queue Tests

**File**: `tests/e2e/admin-queue.spec.ts` (8 test cases)

Test scenarios:

1. ✅ Clear entire queue (emergency)
2. ✅ Force skip a track with reason
3. ✅ Remove track from queue
4. ✅ Recalculate all queue scores
5. ✅ Return 404 for non-existent track
6. ✅ Return 404 for non-existent event
7. ✅ Get queue statistics
8. ✅ Verify skipped tracks in statistics

### Playback Automation Tests

**File**: `tests/e2e/playback.spec.ts` (11 test cases)

Test scenarios:

1. ✅ Get uninitialized playback status
2. ✅ Fail to play without initialization
3. ✅ Return 404 for non-existent device
4. ✅ Return 400 for invalid operations
5. ⏭️ Initialize playback on device (requires Spotify)
6. ⏭️ Play next track from queue (requires Spotify)
7. ⏭️ Pause/resume playback (requires Spotify)
8. ⏭️ Skip to next track (requires Spotify)
9. ⏭️ Enable/disable auto-play (requires Spotify)
10. ⏭️ Stop playback and cleanup (requires Spotify)
11. ⏭️ Handle empty queue gracefully (requires Spotify)

**Note**: Some playback tests are skipped because they require real Spotify device integration, which cannot be automated in CI environment.

### Running E2E Tests Locally

**Prerequisites**:

```bash
# Ensure services are running
docker-compose up -d postgres redis

# Run database migrations
npm run db:migrate
```

**Run Tests**:

```bash
# All E2E tests (headless)
npm run test:e2e

# With UI (recommended for development)
npm run test:e2e:ui

# Watch specific test file
npx playwright test tests/e2e/guest-voting.spec.ts --headed --debug
```

### E2E Test Configuration

**File**: `playwright.config.ts`

Key settings:

- **Test Directory**: `./tests/e2e`
- **Base URL**: `http://localhost:3000`
- **Browsers**: Chromium, Mobile Chrome
- **Parallel**: Yes (but sequential on CI)
- **Retries**: 2 on CI, 0 locally
- **Reporters**: HTML, list, JSON

**Automatic Server Startup**:

```typescript
webServer: [
  {
    command: 'cd apps/api && npm run start:dev',
    url: 'http://localhost:4000/health',
    reuseExistingServer: !process.env.CI,
  },
  {
    command: 'cd apps/web && npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
],
```

### E2E Test Patterns

**1. API-First Setup**

Use `request` fixture to create test data:

```typescript
test.beforeAll(async ({ request }) => {
  const venueResponse = await request.post('/api/v1/venues', {
    data: venueData,
  });
  venue = await venueResponse.json();
});
```

**2. Data Test IDs**

Use `data-testid` attributes for stable selectors:

```typescript
await page.click('[data-testid="vote-button"]');
await expect(page.locator('[data-testid="queue-list"]')).toBeVisible();
```

**3. Auto-Waiting**

Playwright automatically waits for elements:

```typescript
// No need for manual waits
await page.click('button'); // Waits for button to be ready
await expect(page.getByText('Success')).toBeVisible(); // Auto-retries
```

**4. Network Mocking** (when needed)

```typescript
await page.route('**/api/spotify/search', (route) => {
  route.fulfill({
    status: 200,
    body: JSON.stringify({ tracks: mockTracks }),
  });
});
```

### E2E CI/CD Integration

**Workflow**: `.github/workflows/e2e.yml`

Pipeline steps:

1. Start PostgreSQL and Redis services
2. Install dependencies
3. Install Playwright browsers
4. Generate Prisma Client
5. Run database migrations
6. Build applications
7. Run E2E tests
8. Upload test results/reports

**Artifacts**:

- Test results (on failure)
- HTML report (always)
- Screenshots/videos (on failure)

### E2E Test Best Practices

1. **Use API for Setup**: Create test data via API, not UI
2. **Clean Up**: Always delete test data in `afterAll`
3. **Unique Test Data**: Use unique IDs to avoid conflicts
4. **Test Isolation**: Each test should be independent
5. **Explicit Waits**: Use `waitForTimeout` sparingly, prefer auto-waiting
6. **Stable Selectors**: Use `data-testid` over CSS classes
7. **Test Error States**: Don't just test happy paths

---

## Common Issues & Solutions

### Issue: "Cannot find module '@votebox/types'"

**Solution**: Run `npm install` in root and workspace packages

---

### Issue: "Prisma client not generated"

**Solution**:

```bash
npx prisma generate --schema=packages/database/prisma/schema.prisma
```

---

### Issue: "Database connection failed in tests"

**Solution**: Ensure PostgreSQL is running and test database exists:

```bash
docker-compose up -d postgres
```

---

### Issue: "Tests timing out"

**Solution**: Increase Jest timeout in problematic tests:

```typescript
it('slow operation', async () => {
  // test code
}, 10000); // 10 second timeout
```

---

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [NestJS Testing Guide](https://docs.nestjs.com/fundamentals/testing)
- [Testing Best Practices](https://testingjavascript.com/)
- [Playwright Documentation](https://playwright.dev/)

---

## Contributing

When adding new features:

1. Write tests first (TDD approach)
2. Ensure tests pass before committing
3. Update this documentation if testing patterns change
4. Add integration tests for new endpoints
5. Consider e2e test scenarios

---

For questions or issues with testing, please open a GitHub issue.
