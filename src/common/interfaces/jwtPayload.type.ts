import { Role } from 'src/enums/role.enum';
import { Consumer } from 'src/hydra-consumer/entities/Consumer.entity';

export type JwtPayload = {
    address: string;
    id: number;
};

export type AdminJwtPayload = {
    username: string;
    id: number;
    role: Role;
};

export type ConsumerJwtPayload = {
    address: Consumer['address'];
    id: Consumer['id'];
};
