import { GameUser } from '../entities/User.entity';

export type JwtPayload = {
  address: GameUser['address'];
  id: GameUser['id'];
};
