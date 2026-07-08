import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards, UnauthorizedException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { JwtService } from '@nestjs/jwt';
import { GseService } from '../gse/gse.service';
import { UsersService } from '../users/users.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: any;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
  namespace: '/market',
})
export class MarketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MarketGateway.name);
  private subscribedSymbols: Map<string, Set<string>> = new Map(); // symbol -> set of socket IDs
  private authenticatedClients: Map<string, string> = new Map(); // socketId -> userId

  constructor(
    private gseService: GseService,
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract token from handshake auth or query
      const token = client.handshake.auth?.token || client.handshake.query?.token;
      
      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.emit('error', { message: 'Authentication required' });
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = await this.jwtService.verifyAsync(token);
      const user = await this.usersService.findById(payload.sub);
      
      if (!user) {
        this.logger.warn(`Client ${client.id} connected with invalid user ID: ${payload.sub}`);
        client.emit('error', { message: 'Invalid user' });
        client.disconnect();
        return;
      }

      // Store authenticated user info
      client.userId = user.id;
      client.user = user;
      this.authenticatedClients.set(client.id, user.id);

      this.logger.log(`Client connected: ${client.id} (User: ${user.email})`);
      
      // Send authentication success
      client.emit('authenticated', { 
        message: 'Successfully authenticated',
        user: { id: user.id, email: user.email, firstName: user.firstName }
      });

    } catch (error) {
      this.logger.error(`Authentication failed for client ${client.id}:`, error.message);
      client.emit('error', { message: 'Authentication failed' });
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    const userId = this.authenticatedClients.get(client.id);
    this.logger.log(`Client disconnected: ${client.id} (User: ${userId || 'unknown'})`);
    
    // Remove from all subscriptions
    this.subscribedSymbols.forEach((sockets) => sockets.delete(client.id));
    
    // Remove from authenticated clients
    this.authenticatedClients.delete(client.id);
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() symbols: string[]
  ) {
    // Ensure client is authenticated
    if (!client.userId) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    // Validate symbols array
    if (!Array.isArray(symbols) || symbols.length === 0) {
      client.emit('error', { message: 'Invalid symbols array' });
      return;
    }

    // Limit subscription count per client (prevent abuse)
    const maxSubscriptions = 50;
    if (symbols.length > maxSubscriptions) {
      client.emit('error', { message: `Cannot subscribe to more than ${maxSubscriptions} symbols` });
      return;
    }

    symbols.forEach((symbol) => {
      if (typeof symbol !== 'string' || symbol.length < 2 || symbol.length > 4) {
        return; // Skip invalid symbols
      }
      
      const upper = symbol.toUpperCase();
      if (!this.subscribedSymbols.has(upper)) {
        this.subscribedSymbols.set(upper, new Set());
      }
      this.subscribedSymbols.get(upper).add(client.id);
    });

    // Send current data immediately
    const validSymbols = symbols.filter(s => typeof s === 'string' && s.length >= 2 && s.length <= 4);
    const data = validSymbols.map((s) => this.gseService.getLiveBySymbol(s)).filter(Boolean);
    client.emit('priceUpdate', data);

    this.logger.log(`Client ${client.id} subscribed to ${validSymbols.length} symbols`);
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() symbols: string[]
  ) {
    // Ensure client is authenticated
    if (!client.userId) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    if (!Array.isArray(symbols)) {
      client.emit('error', { message: 'Invalid symbols array' });
      return;
    }

    symbols.forEach((symbol) => {
      if (typeof symbol === 'string') {
        this.subscribedSymbols.get(symbol.toUpperCase())?.delete(client.id);
      }
    });

    this.logger.log(`Client ${client.id} unsubscribed from ${symbols.length} symbols`);
  }

  // Broadcast live prices every 30 seconds
  @Cron('*/30 * * * * *')
  broadcastLivePrices() {
    const allLive = this.gseService.getAllLive();
    if (allLive.length === 0) return;

    // Only broadcast to authenticated clients
    const authenticatedSocketIds = Array.from(this.authenticatedClients.keys());
    
    // Broadcast to subscribed clients only (more efficient)
    this.subscribedSymbols.forEach((socketIds, symbol) => {
      const symbolData = allLive.filter(stock => stock.name === symbol);
      if (symbolData.length > 0) {
        socketIds.forEach(socketId => {
          if (authenticatedSocketIds.includes(socketId)) {
            this.server.to(socketId).emit('priceUpdate', symbolData);
          }
        });
      }
    });
  }

  // Method to broadcast order updates to specific user
  broadcastOrderUpdate(userId: string, orderData: any) {
    const userSockets = Array.from(this.authenticatedClients.entries())
      .filter(([_, uid]) => uid === userId)
      .map(([socketId]) => socketId);

    userSockets.forEach(socketId => {
      this.server.to(socketId).emit('orderUpdate', orderData);
    });
  }
}
