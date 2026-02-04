import { Role } from 'src/auth/enums/role.enum';

export type JwtPayload = {
    address: string;
    id: number;
};

export type AdminJwtPayload = {
    username: string;
    id: number;
    role: Role;
};
