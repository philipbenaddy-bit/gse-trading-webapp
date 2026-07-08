import { ConfigService } from '@nestjs/config';
export declare const createSupabaseClient: (config: ConfigService) => import("@supabase/supabase-js").SupabaseClient<any, "public", "public", any, any>;
