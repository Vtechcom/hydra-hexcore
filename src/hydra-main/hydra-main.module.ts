import { Module } from '@nestjs/common';
import { HydraMainService } from './hydra-main.service';

@Module({
  providers: [HydraMainService],
})
export class HydraMainModule {}
