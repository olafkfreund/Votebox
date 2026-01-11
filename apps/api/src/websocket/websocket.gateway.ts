import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: process.env.WEB_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class WebSocketGatewayService
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('WebSocketGateway');

  afterInit(_server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinEvent')
  handleJoinEvent(@ConnectedSocket() client: Socket, @MessageBody() data: { eventId: string }) {
    client.join(`event:${data.eventId}`);
    this.logger.log(`Client ${client.id} joined event ${data.eventId}`);
    return { success: true };
  }

  @SubscribeMessage('leaveEvent')
  handleLeaveEvent(@ConnectedSocket() client: Socket, @MessageBody() data: { eventId: string }) {
    client.leave(`event:${data.eventId}`);
    this.logger.log(`Client ${client.id} left event ${data.eventId}`);
    return { success: true };
  }

  // Broadcast methods to be called from other services

  emitVoteUpdate(eventId: string, trackId: string, voteCount: number, newPosition: number) {
    this.server.to(`event:${eventId}`).emit('voteUpdate', {
      eventId,
      trackId,
      voteCount,
      newPosition,
    });
  }

  emitQueueUpdate(eventId: string, queue: any[]) {
    this.server.to(`event:${eventId}`).emit('queueUpdate', {
      eventId,
      queue,
    });
  }

  emitNowPlayingUpdate(eventId: string, track: any) {
    this.server.to(`event:${eventId}`).emit('nowPlayingUpdate', {
      eventId,
      track,
    });
  }

  emitEventStatusChange(eventId: string, status: string) {
    this.server.to(`event:${eventId}`).emit('eventStatusChange', {
      eventId,
      status,
    });
  }
}
