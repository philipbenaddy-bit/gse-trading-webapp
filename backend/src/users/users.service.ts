import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { SupabaseService } from '../supabase/supabase.service';
import { RegisterDto } from '../auth/dto/register.dto';

@Injectable()
export class UsersService {
  constructor(private supabase: SupabaseService) {}

  async create(data: RegisterDto & { password: string }) {
    // Use admin client to bypass RLS for user creation
    const client = this.supabase.getAdminClient();

    // Create user
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

    if (userError) throw new Error(userError.message);

    // Auto-create wallet for new user
    const { error: walletError } = await client
      .from('wallets')
      .insert({
        user_id: user.id,
        balance: 0,
        locked_balance: 0,
      });

    if (walletError) throw new Error(walletError.message);

    return this.mapUser(user);
  }

  async findById(id: string) {
    // Use admin client to bypass RLS for internal operations
    const client = this.supabase.getAdminClient();
    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return this.mapUser(data);
  }

  async findByEmail(email: string) {
    // Use admin client to bypass RLS for internal operations
    const client = this.supabase.getAdminClient();
    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) return null;
    return this.mapUser(data);
  }

  async findByEmailWithPassword(email: string) {
    // Use admin client to bypass RLS for authentication
    const client = this.supabase.getAdminClient();
    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) return null;
    return this.mapUser(data, true);
  }

  async findByPhone(phone: string) {
    // Use admin client to bypass RLS for internal operations
    const client = this.supabase.getAdminClient();
    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('phone', phone)
      .single();

    if (error) return null;
    return this.mapUser(data);
  }

  async updateRefreshToken(userId: string, token: string | null) {
    // Use admin client to bypass RLS for internal operations
    const client = this.supabase.getAdminClient();
    const hashed = token ? await bcrypt.hash(token, 10) : null;
    
    await client
      .from('users')
      .update({ refresh_token: hashed })
      .eq('id', userId);
  }

  async updateKyc(
    userId: string,
    data: {
      ghanaCardNumber?: string;
      ghanaCardImageUrl?: string;
      selfieImageUrl?: string;
    },
  ) {
    // Use admin client to bypass RLS for internal operations
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
    // Use admin client to bypass RLS for admin operations
    const client = this.supabase.getAdminClient();
    const { data, error } = await client
      .from('users')
      .select('*');

    if (error) throw new Error(error.message);
    return data.map((u) => this.mapUser(u));
  }

  // Map snake_case DB fields to camelCase
  private mapUser(data: any, includePassword = false) {
    if (!data) return null;
    
    const user: any = {
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
}
