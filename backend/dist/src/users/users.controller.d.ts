import { UsersService } from './users.service';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    getProfile(req: any): Promise<any>;
    submitKyc(req: any, body: {
        ghanaCardNumber: string;
        ghanaCardImageUrl?: string;
        selfieImageUrl?: string;
    }): Promise<any>;
}
