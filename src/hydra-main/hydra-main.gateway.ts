import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
    MessageBody,
    ConnectedSocket,
    SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway(3011, { transports: ['websocket'] }) // Connect to ws://localhost:3011
export class HydraMainGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    afterInit(server: Server) {
        console.log('WebSocket server initialized');
    }

    handleConnection(client: Socket) {
        console.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);
    }

    // Example: Emit a message to all clients
    sendMessageToClients(data: string) {
        this.server.emit('message', data); // Broadcast a message to all connected clients
    }

    @SubscribeMessage('message')
    async handleTyping(@MessageBody() payload, @ConnectedSocket() client: Socket) {
        console.log(payload.id, payload.room_id, client.id);
        this.sendMessageToClients(payload.toString());
    }
}
