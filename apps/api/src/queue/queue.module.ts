import { Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { QueueController } from './queue.controller';
import { AdminQueueController } from './admin-queue.controller';
import { VoteTrackerService } from './vote-tracker.service';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [WebSocketModule],
  controllers: [QueueController, AdminQueueController],
  providers: [QueueService, VoteTrackerService],
  exports: [QueueService, VoteTrackerService],
})
export class QueueModule {}
