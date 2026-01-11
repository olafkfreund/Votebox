import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { VenuesModule } from './venues/venues.module';
import { EventsModule } from './events/events.module';
import { SpotifyModule } from './spotify/spotify.module';
import { QueueModule } from './queue/queue.module';
import { WebSocketModule } from './websocket/websocket.module';
import { PlaybackModule } from './playback/playback.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    PrismaModule,
    VenuesModule,
    EventsModule,
    SpotifyModule,
    QueueModule,
    WebSocketModule,
    PlaybackModule,
    // Modules will be added here as we create them:
    // AuthModule,
    // VotesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
