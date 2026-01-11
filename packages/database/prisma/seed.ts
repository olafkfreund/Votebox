import { PrismaClient, EventStatus, PlaylistSource, SubscriptionPlan } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create a demo venue
  const venuePassword = await bcrypt.hash('DemoVenue123!', 10);
  const venue = await prisma.venue.upsert({
    where: { slug: 'demo-venue' },
    update: {},
    create: {
      name: 'Demo Venue',
      slug: 'demo-venue',
      email: 'demo@votebox.com',
      hashedPassword: venuePassword,
      settings: {
        defaultVotesPerHour: 3,
        defaultVoteCooldown: 30,
        allowExplicit: true,
        branding: {
          primaryColor: '#FF5733',
          secondaryColor: '#3366FF',
        },
      },
      subscription: {
        create: {
          plan: SubscriptionPlan.PRO,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      },
    },
  });

  console.log(`✅ Created venue: ${venue.name}`);

  // Create a demo event
  const event = await prisma.event.upsert({
    where: { id: 'demo-event-1' },
    update: {},
    create: {
      id: 'demo-event-1',
      venueId: venue.id,
      name: 'Doom Rock Night',
      description: 'Heavy riffs and thunderous drums - vote for your favorite doom metal tracks!',
      scheduledDate: new Date(),
      startTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      endTime: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours from now
      timezone: 'UTC',
      playlistSource: PlaylistSource.GENRE,
      playlistConfig: {
        type: 'genre',
        genres: ['doom-metal', 'stoner-rock', 'sludge-metal'],
        filters: {
          explicitAllowed: true,
          minPopularity: 10,
          maxDuration: 600,
          energy: [0.3, 0.8],
        },
      },
      votingRules: {
        votesPerHour: 3,
        voteCooldown: 30,
        replayCooldown: 7200,
        maxVoteWeight: 10,
        queueAlgorithm: 'weighted',
      },
      status: EventStatus.UPCOMING,
    },
  });

  console.log(`✅ Created event: ${event.name}`);

  // Create another venue for testing
  const venue2Password = await bcrypt.hash('TestVenue456!', 10);
  const venue2 = await prisma.venue.upsert({
    where: { slug: 'test-pub' },
    update: {},
    create: {
      name: 'The Test Pub',
      slug: 'test-pub',
      email: 'test@votebox.com',
      hashedPassword: venue2Password,
      settings: {
        defaultVotesPerHour: 5,
        defaultVoteCooldown: 20,
        allowExplicit: false,
        branding: {
          primaryColor: '#2ECC71',
          secondaryColor: '#3498DB',
        },
      },
      subscription: {
        create: {
          plan: SubscriptionPlan.STARTER,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      },
    },
  });

  console.log(`✅ Created venue: ${venue2.name}`);

  console.log('🎉 Seeding completed!');
  console.log('\n📝 Demo credentials:');
  console.log('   Email: demo@votebox.com');
  console.log('   Password: DemoVenue123!');
  console.log('   Slug: demo-venue');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
