import { Module } from '@nestjs/common';
import { HydraGameService } from './hydra-game.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HydraGameController } from './hydra-game.controller';

import { HydraNode } from '../hydra-main/entities/HydraNode.entity';
import { Account } from '../hydra-main/entities/Account.entity';
import { HydraParty } from '../hydra-main/entities/HydraParty.entity';
import { GameUser } from './entities/GameUser.entity';
import { GameRoom } from './entities/Room.entity';
import { GameRoomDetail } from './entities/RoomDetail.entity';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from 'src/constants';
import { EventGateway } from './event.gateway';
import { HydraMainService } from 'src/hydra-main/hydra-main.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([HydraNode, Account, HydraParty, GameUser, GameRoom, GameRoomDetail]),
        JwtModule.register({
            secret: jwtConstants.secret,
            signOptions: { expiresIn: '1 weeks' },
        }),
    ],
    providers: [HydraGameService, EventGateway, HydraMainService],
    controllers: [HydraGameController],
    exports: [EventGateway, JwtModule],
})
export class HydraGameModule {}
