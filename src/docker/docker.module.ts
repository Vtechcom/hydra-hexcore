import { Module } from '@nestjs/common';
import { DockerService } from './docker.service';
import { HydraConfig } from 'src/config/hydra.config';

@Module({
    providers: [DockerService, HydraConfig],
    exports: [DockerService, HydraConfig],
})
export class DockerModule {}
