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
exports.NewsEntity = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
let NewsEntity = class NewsEntity {
};
exports.NewsEntity = NewsEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], NewsEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 200 }),
    __metadata("design:type", String)
], NewsEntity.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], NewsEntity.prototype, "content", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", String)
], NewsEntity.prototype, "summary", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 200, nullable: true }),
    __metadata("design:type", String)
], NewsEntity.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, nullable: true, name: 'source_url' }),
    __metadata("design:type", String)
], NewsEntity.prototype, "sourceUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, nullable: true, name: 'image_url' }),
    __metadata("design:type", String)
], NewsEntity.prototype, "imageUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-array', nullable: true, name: 'related_symbols' }),
    __metadata("design:type", Array)
], NewsEntity.prototype, "relatedSymbols", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], NewsEntity.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'author_id', nullable: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], NewsEntity.prototype, "authorId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'author_id' }),
    __metadata("design:type", user_entity_1.User)
], NewsEntity.prototype, "author", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0, name: 'view_count' }),
    __metadata("design:type", Number)
], NewsEntity.prototype, "viewCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0, name: 'comment_count' }),
    __metadata("design:type", Number)
], NewsEntity.prototype, "commentCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0, name: 'reaction_count' }),
    __metadata("design:type", Number)
], NewsEntity.prototype, "reactionCount", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], NewsEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], NewsEntity.prototype, "updatedAt", void 0);
exports.NewsEntity = NewsEntity = __decorate([
    (0, typeorm_1.Entity)('news'),
    (0, typeorm_1.Index)(['category']),
    (0, typeorm_1.Index)(['createdAt'])
], NewsEntity);
//# sourceMappingURL=news.entity.js.map