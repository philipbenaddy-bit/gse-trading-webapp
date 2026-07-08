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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReactionEntity = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
const news_entity_1 = require("./news.entity");
let ReactionEntity = class ReactionEntity {
};
exports.ReactionEntity = ReactionEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ReactionEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'news_id' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], ReactionEntity.prototype, "newsId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => news_entity_1.NewsEntity),
    (0, typeorm_1.JoinColumn)({ name: 'news_id' }),
    __metadata("design:type", news_entity_1.NewsEntity)
], ReactionEntity.prototype, "news", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'user_id' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], ReactionEntity.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], ReactionEntity.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 10 }),
    __metadata("design:type", String)
], ReactionEntity.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], ReactionEntity.prototype, "createdAt", void 0);
exports.ReactionEntity = ReactionEntity = __decorate([
    (0, typeorm_1.Entity)('reactions'),
    (0, typeorm_1.Unique)(['newsId', 'userId']),
    (0, typeorm_1.Index)(['newsId', 'type'])
], ReactionEntity);
//# sourceMappingURL=reaction.entity.js.map