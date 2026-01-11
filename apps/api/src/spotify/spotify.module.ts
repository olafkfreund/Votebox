import { Module } from '@nestjs/common';
import { SpotifyAuthService } from './spotify-auth.service';
import { SpotifyApiService } from './spotify-api.service';
import { SpotifyController } from './spotify.controller';

@Module({
  controllers: [SpotifyController],
  providers: [SpotifyAuthService, SpotifyApiService],
  exports: [SpotifyAuthService, SpotifyApiService],
})
export class SpotifyModule {}
