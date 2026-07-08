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
exports.CommentEntity = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
const news_entity_1 = require("./news.entity");
let CommentEntity = class CommentEntity {
};
exports.CommentEntity = CommentEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], CommentEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'news_id' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], CommentEntity.prototype, "newsId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => news_entity_1.NewsEntity),
    (0, typeorm_1.JoinColumn)({ name: 'news_id' }),
    __metadata("design:type", news_entity_1.NewsEntity)
], CommentEntity.prototype, "news", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'user_id' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], CommentEntity.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], CommentEntity.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], CommentEntity.prototype, "content", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'parent_id', nullable: true }),
    __metadata("design:type", String)
], CommentEntity.prototype, "parentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => CommentEntity, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'parent_id' }),
    __metadata("design:type", CommentEntity)
], CommentEntity.prototype, "parent", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0, name: 'reply_count' }),
    __metadata("design:type", Number)
], CommentEntity.prototype, "replyCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0, name: 'reaction_count' }),
    __metadata("design:type", Number)
], CommentEntity.prototype, "reactionCount", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], CommentEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], CommentEntity.prototype, "updatedAt", void 0);
exports.CommentEntity = CommentEntity = __decorate([
    (0, typeorm_1.Entity)('comments'),
    (0, typeorm_1.Index)(['newsId', 'createdAt']),
    (0, typeorm_1.Index)(['parentId'])
], CommentEntity);
//# sourceMappingURL=comment.entity.js.map