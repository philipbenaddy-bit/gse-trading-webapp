import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { GseService } from '../gse/gse.service';
import { UsersService } from '../users/users.service';
interface AuthenticatedSocket extends Socket {
    userId?: string;
    user?: any;
}
export declare class MarketGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private gseService;
    private jwtService;
    private usersService;
    server: Server;
    private readonly logger;
    private subscribedSymbols;
    private authenticatedClients;
    constructor(gseService: GseService, jwtService: JwtService, usersService: UsersService);
    handleConnection(client: AuthenticatedSocket): Promise<void>;
    handleDisconnect(client: AuthenticatedSocket): void;
    handleSubscribe(client: AuthenticatedSocket, symbols: string[]): void;
    handleUnsubscribe(client: AuthenticatedSocket, symbols: string[]): void;
    broadcastLivePrices(): void;
    broadcastOrderUpdate(userId: string, orderData: any): void;
}
export {};
