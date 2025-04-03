import { Module } from '@nestjs/common';
import { HydraMainService } from './hydra-main.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HydraNode } from './entities/HydraNode.entity';
import { HydraMainController } from './hydra-main.controller';
import { Account } from './entities/Account.entity';
import { HydraParty } from './entities/HydraParty.entity';
import { GameRoom } from '../hydra-game/entities/Room.entity';
import { HydraAdminService } from './hydra-admin.service';
import { User } from './entities/User.entity';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from 'src/constants';
@Module({
    imports: [
        TypeOrmModule.forFeature([HydraNode, Account, HydraParty, GameRoom, User]),
        JwtModule.register({
            secret: jwtConstants.secret,
            signOptions: { expiresIn: '1day' },
        }),
    ],
    providers: [HydraMainService, HydraAdminService],
    controllers: [HydraMainController],
    exports: [JwtModule, HydraAdminService, HydraMainService],
})
export class HydraMainModule {}
