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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = require("bcryptjs");
const supabase_service_1 = require("../supabase/supabase.service");
let UsersService = class UsersService {
    constructor(supabase) {
        this.supabase = supabase;
    }
    async create(data) {
        const client = this.supabase.getAdminClient();
        const { data: user, error: userError } = await client
            .from('users')
            .insert({
            email: data.email,
            phone: data.phone,
            first_name: data.firstName,
            last_name: data.lastName,
            password: data.password,
            role: 'user',
            kyc_status: 'pending',
        })
            .select()
            .single();
        if (userError)
            throw new Error(userError.message);
        const { error: walletError } = await client
            .from('wallets')
            .insert({
            user_id: user.id,
            balance: 0,
            locked_balance: 0,
        });
        if (walletError)
            throw new Error(walletError.message);
        return this.mapUser(user);
    }
    async findById(id) {
        const client = this.supabase.getAdminClient();
        const { data, error } = await client
            .from('users')
            .select('*')
            .eq('id', id)
            .single();
        if (error)
            return null;
        return this.mapUser(data);
    }
    async findByEmail(email) {
        const client = this.supabase.getAdminClient();
        const { data, error } = await client
            .from('users')
            .select('*')
            .eq('email', email)
            .single();
        if (error)
            return null;
        return this.mapUser(data);
    }
    async findByEmailWithPassword(email) {
        const client = this.supabase.getAdminClient();
        const { data, error } = await client
            .from('users')
            .select('*')
            .eq('email', email)
            .single();
        if (error)
            return null;
        return this.mapUser(data, true);
    }
    async findByPhone(phone) {
        const client = this.supabase.getAdminClient();
        const { data, error } = await client
            .from('users')
            .select('*')
            .eq('phone', phone)
            .single();
        if (error)
            return null;
        return this.mapUser(data);
    }
    async updateRefreshToken(userId, token) {
        const client = this.supabase.getAdminClient();
        const hashed = token ? await bcrypt.hash(token, 10) : null;
        await client
            .from('users')
            .update({ refresh_token: hashed })
            .eq('id', userId);
    }
    async updateKyc(userId, data) {
        const client = this.supabase.getAdminClient();
        await client
            .from('users')
            .update({
            ghana_card_number: data.ghanaCardNumber,
            ghana_card_image_url: data.ghanaCardImageUrl,
            selfie_image_url: data.selfieImageUrl,
            kyc_status: 'submitted',
        })
            .eq('id', userId);
        return this.findById(userId);
    }
    async findAll() {
        const client = this.supabase.getAdminClient();
        const { data, error } = await client
            .from('users')
            .select('*');
        if (error)
            throw new Error(error.message);
        return data.map((u) => this.mapUser(u));
    }
    mapUser(data, includePassword = false) {
        if (!data)
            return null;
        const user = {
            id: data.id,
            email: data.email,
            phone: data.phone,
            firstName: data.first_name,
            lastName: data.last_name,
            role: data.role,
            kycStatus: data.kyc_status,
            ghanaCardNumber: data.ghana_card_number,
            ghanaCardImageUrl: data.ghana_card_image_url,
            selfieImageUrl: data.selfie_image_url,
            isEmailVerified: data.is_email_verified,
            isPhoneVerified: data.is_phone_verified,
            refreshToken: data.refresh_token,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
        };
        if (includePassword) {
            user.password = data.password;
        }
        return user;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], UsersService);
//# sourceMappingURL=users.service.js.map