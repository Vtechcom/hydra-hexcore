import { Module } from '@nestjs/common';
import { HydraMainService } from './hydra-main.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HydraNode } from './entities/HydraNode.entity';
import { HydraMainController } from './hydra-main.controller';
import { Account } from './entities/Account.entity';
import { HydraParty } from './entities/HydraParty.entity';
import { GameRoom } from '../hydra-game/entities/Room.entity';
import { WebsocketProxyGateway } from 'src/proxy/ws-proxy.gateway';
import { ConsumerKeyMapper } from 'src/hydra-consumer/entities/ConsumerKeyMapper.entity';
import { HydraConsumerModule } from 'src/hydra-consumer/hydra-consumer.module';

@Module({
    imports: [TypeOrmModule.forFeature([HydraNode, Account, HydraParty, GameRoom, ConsumerKeyMapper]), HydraConsumerModule ],
    providers: [HydraMainService, WebsocketProxyGateway],
    controllers: [HydraMainController],
})
export class HydraMainModule {}
