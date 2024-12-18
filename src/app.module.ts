import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HydraMainModule } from './hydra-main/hydra-main.module';
import { ShellModule } from './shell/shell.module';

@Module({
  imports: [HydraMainModule, ShellModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
