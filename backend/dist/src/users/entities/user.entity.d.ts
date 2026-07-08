import { Order } from '../../orders/entities/order.entity';
import { Wallet } from '../../wallet/entities/wallet.entity';
import { Portfolio } from '../../portfolio/entities/portfolio.entity';
export declare enum UserRole {
    USER = "user",
    ADMIN = "admin"
}
export declare enum KycStatus {
    PENDING = "pending",
    SUBMITTED = "submitted",
    APPROVED = "approved",
    REJECTED = "rejected"
}
export declare class User {
    id: string;
    email: string;
    phone: string;
    firstName: string;
    lastName: string;
    password: string;
    role: UserRole;
    kycStatus: KycStatus;
    ghanaCardNumber: string;
    ghanaCardImageUrl: string;
    selfieImageUrl: string;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
    refreshToken: string;
    orders: Order[];
    wallet: Wallet;
    portfolio: Portfolio[];
    createdAt: Date;
    updatedAt: Date;
}
