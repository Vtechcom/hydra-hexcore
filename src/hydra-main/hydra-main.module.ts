import { Module } from '@nestjs/common';
import { HydraMainService } from './hydra-main.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HydraNode } from './entities/HydraNode.entity';
import { HydraMainController } from './hydra-main.controller';

@Module({
  imports: [TypeOrmModule.forFeature([HydraNode])],
  providers: [HydraMainService],
  controllers: [HydraMainController],
})
export class HydraMainModule {}
