import { SupabaseService } from '../supabase/supabase.service';
import { RegisterDto } from '../auth/dto/register.dto';
export declare class UsersService {
    private supabase;
    constructor(supabase: SupabaseService);
    create(data: RegisterDto & {
        password: string;
    }): Promise<any>;
    findById(id: string): Promise<any>;
    findByEmail(email: string): Promise<any>;
    findByEmailWithPassword(email: string): Promise<any>;
    findByPhone(phone: string): Promise<any>;
    updateRefreshToken(userId: string, token: string | null): Promise<void>;
    updateKyc(userId: string, data: {
        ghanaCardNumber?: string;
        ghanaCardImageUrl?: string;
        selfieImageUrl?: string;
    }): Promise<any>;
    findAll(): Promise<any[]>;
    private mapUser;
}
