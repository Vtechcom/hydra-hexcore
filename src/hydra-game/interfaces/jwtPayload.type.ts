import { GameUser } from '../entities/GameUser.entity';

export type JwtPayload = {
    address: GameUser['address'];
    id: GameUser['id'];
};
