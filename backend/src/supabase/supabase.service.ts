import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private client: SupabaseClient;
  private adminClient: SupabaseClient;

  constructor(private config: ConfigService) {}

  onModuleInit() {
    const supabaseUrl = this.config.get<string>('SUPABASE_URL');
    const supabaseAnonKey = this.config.get<string>('SUPABASE_ANON_KEY');
    const supabaseServiceKey = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase configuration (SUPABASE_URL or SUPABASE_ANON_KEY)');
    }

    // Regular client with anon key (for RLS-protected operations)
    this.client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Admin client with service role key (bypasses RLS)
    if (supabaseServiceKey) {
      this.adminClient = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    } else {
      console.warn('SUPABASE_SERVICE_ROLE_KEY not configured. Admin operations will use anon key.');
      this.adminClient = this.client;
    }
  }

  getClient(): SupabaseClient {
    return this.client;
  }

  getAdminClient(): SupabaseClient {
    return this.adminClient;
  }
}
