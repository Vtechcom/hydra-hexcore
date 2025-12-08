import { Role } from 'src/enums/role.enum';

export type JwtPayload = {
    address: string;
    id: number;
};

export type AdminJwtPayload = {
    username: string;
    id: number;
    role: Role;
};
