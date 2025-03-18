import { Module } from '@nestjs/common';
import { HydraGameService } from './hydra-game.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HydraGameController } from './hydra-game.controller';

import { HydraNode } from '../hydra-main/entities/HydraNode.entity';
import { Account } from '../hydra-main/entities/Account.entity';
import { HydraParty } from '../hydra-main/entities/HydraParty.entity';

@Module({
  imports: [TypeOrmModule.forFeature([HydraNode, Account, HydraParty])],
  providers: [HydraGameService],
  controllers: [HydraGameController],
})
export class HydraGameModule { }
