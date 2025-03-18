import { Exclude } from 'class-transformer';
import { GameUser } from 'src/hydra-game/entities/User.entity';

export class ResUserInfoDto {
  id: number;

  address: string;

  @Exclude()
  password: string;

  avatar: string;

  createdAt: string;

  constructor(partial: Partial<GameUser>) {
    Object.assign(this, partial);
  }
}
