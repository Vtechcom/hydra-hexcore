import { Role } from 'src/enums/role.enum';
import { GameUser } from '../entities/GameUser.entity';
import { Consumer } from 'src/hydra-consumer/entities/Consumer.entity';
export type JwtPayload = {
    address: GameUser['address'];
    id: GameUser['id'];
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
