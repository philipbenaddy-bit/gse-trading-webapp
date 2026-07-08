"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var MarketGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const jwt_1 = require("@nestjs/jwt");
const gse_service_1 = require("../gse/gse.service");
const users_service_1 = require("../users/users.service");
let MarketGateway = MarketGateway_1 = class MarketGateway {
    constructor(gseService, jwtService, usersService) {
        this.gseService = gseService;
        this.jwtService = jwtService;
        this.usersService = usersService;
        this.logger = new common_1.Logger(MarketGateway_1.name);
        this.subscribedSymbols = new Map();
        this.authenticatedClients = new Map();
    }
    async handleConnection(client) {
        try {
            const token = client.handshake.auth?.token || client.handshake.query?.token;
            if (!token) {
                this.logger.warn(`Client ${client.id} connected without token`);
                client.emit('error', { message: 'Authentication required' });
                client.disconnect();
                return;
            }
            const payload = await this.jwtService.verifyAsync(token);
            const user = await this.usersService.findById(payload.sub);
            if (!user) {
                this.logger.warn(`Client ${client.id} connected with invalid user ID: ${payload.sub}`);
                client.emit('error', { message: 'Invalid user' });
                client.disconnect();
                return;
            }
            client.userId = user.id;
            client.user = user;
            this.authenticatedClients.set(client.id, user.id);
            this.logger.log(`Client connected: ${client.id} (User: ${user.email})`);
            client.emit('authenticated', {
                message: 'Successfully authenticated',
                user: { id: user.id, email: user.email, firstName: user.firstName }
            });
        }
        catch (error) {
            this.logger.error(`Authentication failed for client ${client.id}:`, error.message);
            client.emit('error', { message: 'Authentication failed' });
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        const userId = this.authenticatedClients.get(client.id);
        this.logger.log(`Client disconnected: ${client.id} (User: ${userId || 'unknown'})`);
        this.subscribedSymbols.forEach((sockets) => sockets.delete(client.id));
        this.authenticatedClients.delete(client.id);
    }
    handleSubscribe(client, symbols) {
        if (!client.userId) {
            client.emit('error', { message: 'Not authenticated' });
            return;
        }
        if (!Array.isArray(symbols) || symbols.length === 0) {
            client.emit('error', { message: 'Invalid symbols array' });
            return;
        }
        const maxSubscriptions = 50;
        if (symbols.length > maxSubscriptions) {
            client.emit('error', { message: `Cannot subscribe to more than ${maxSubscriptions} symbols` });
            return;
        }
        symbols.forEach((symbol) => {
            if (typeof symbol !== 'string' || symbol.length < 2 || symbol.length > 4) {
                return;
            }
            const upper = symbol.toUpperCase();
            if (!this.subscribedSymbols.has(upper)) {
                this.subscribedSymbols.set(upper, new Set());
            }
            this.subscribedSymbols.get(upper).add(client.id);
        });
        const validSymbols = symbols.filter(s => typeof s === 'string' && s.length >= 2 && s.length <= 4);
        const data = validSymbols.map((s) => this.gseService.getLiveBySymbol(s)).filter(Boolean);
        client.emit('priceUpdate', data);
        this.logger.log(`Client ${client.id} subscribed to ${validSymbols.length} symbols`);
    }
    handleUnsubscribe(client, symbols) {
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
    broadcastLivePrices() {
        const allLive = this.gseService.getAllLive();
        if (allLive.length === 0)
            return;
        const authenticatedSocketIds = Array.from(this.authenticatedClients.keys());
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
    broadcastOrderUpdate(userId, orderData) {
        const userSockets = Array.from(this.authenticatedClients.entries())
            .filter(([_, uid]) => uid === userId)
            .map(([socketId]) => socketId);
        userSockets.forEach(socketId => {
            this.server.to(socketId).emit('orderUpdate', orderData);
        });
    }
};
exports.MarketGateway = MarketGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], MarketGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('subscribe'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Array]),
    __metadata("design:returntype", void 0)
], MarketGateway.prototype, "handleSubscribe", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('unsubscribe'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Array]),
    __metadata("design:returntype", void 0)
], MarketGateway.prototype, "handleUnsubscribe", null);
__decorate([
    (0, schedule_1.Cron)('*/30 * * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MarketGateway.prototype, "broadcastLivePrices", null);
exports.MarketGateway = MarketGateway = MarketGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:5173',
            credentials: true,
        },
        namespace: '/market',
    }),
    __metadata("design:paramtypes", [gse_service_1.GseService,
        jwt_1.JwtService,
        users_service_1.UsersService])
], MarketGateway);
//# sourceMappingURL=market.gateway.js.map