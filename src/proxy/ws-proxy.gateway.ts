import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, WebSocket } from 'ws';
import { Server as IoServer, Socket as IoSocket } from 'socket.io';
import { Logger } from '@nestjs/common';
import configuration from 'src/config/configuration';
import { HydraConsumerService } from 'src/hydra-consumer/hydra-consumer.service';


@WebSocketGateway({ 
  cors: {
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  },
  transports: ['websocket'],
})
export class WebsocketProxyGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly hydraConsumerService: HydraConsumerService) {}
  @WebSocketServer() server: IoServer;
  private logger = new Logger('WebsocketProxyGateway');
  private clients: Map<IoSocket, WebSocket> = new Map(); // Lưu trữ kết nối client và target

  async handleConnection(client: IoSocket, ...args: any[]) {
    // Get client query params
    const clientQuery = client.handshake.query;
    const clientHost = client.handshake.headers.host;
    // Check if host matches subdomain pattern <apikey>.hydranode.io.vn
    const regex = new RegExp(configuration().proxy.matchPattern);
    const subdomainMatch = regex.test(clientHost);
    if (!subdomainMatch) {
      this.logger.error(`Invalid host: ${clientHost}`);
      client.disconnect();
      return;
    }
    const apikey = clientHost.replace(regex, '$1');
    const url = await this.hydraConsumerService.getUrlByConsumerKey(apikey);
    // Build query string without EIO and transport params
    const queryParams = new URLSearchParams();
    for (const [key, value] of Object.entries(clientQuery)) {
      if (key !== 'EIO' && key !== 'transport') {
        queryParams.append(key, value as string);
      }
    }
    const queryString = queryParams.toString();
    const targetUrl = `ws://${url}${queryString ? '?' + queryString : ''}`;
    this.logger.log(`New connection: Proxying to ${targetUrl}`);

    // Tạo kết nối tới target server (localhost:<port>)
    const target = new WebSocket(targetUrl);

    target.on('open', () => {
      this.logger.log(`Connected to target: ${targetUrl}`);
      this.clients.set(client, target); // Lưu cặp client-target
    });

    // Chuyển tiếp message từ client sang target
    client.on('message', (data) => {
      const payload = JSON.stringify(data)
      if (target.readyState === WebSocket.OPEN) {
        target.send(Buffer.from(payload));
      }
    });

    // Chuyển tiếp message từ target sang client
    target.on('message', (data) => {
      client.emit('message', data.toString());
    });

    // Xử lý khi target đóng kết nối
    target.on('close', () => {
      this.logger.log(`Target ${targetUrl} disconnected`);
      client.disconnect();
      this.clients.delete(client);
    });

    // Xử lý lỗi từ target
    target.on('error', (error) => {
      this.logger.error(`Target error: ${error.message}`);
      client.disconnect();
      this.clients.delete(client);
    });
  }

  handleDisconnect(client: IoSocket) {
    const target = this.clients.get(client);
    if (target) {
      target.close();
      this.clients.delete(client);
      this.logger.log('Client disconnected');
    }
  }
}
