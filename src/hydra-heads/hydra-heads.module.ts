import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HydraHead } from './entities/HydraHead.entity';
import { HydraNode } from 'src/hydra-main/entities/HydraNode.entity';
import { HydraHeadService } from './hydra-heads.service';
import { HydraHeadController } from './hydra-heads.controller';
import { Account } from 'src/hydra-main/entities/Account.entity';
import { JwtModule } from '@nestjs/jwt';
import { OgmiosClientService } from 'src/hydra-main/ogmios-client.service';
import { jwtConstants } from 'src/constants';
import { DockerModule } from 'src/docker/docker.module';
import { HydraConfig } from 'src/config/hydra.config';

@Module({
    imports: [
        TypeOrmModule.forFeature([HydraHead, HydraNode, Account]),
        JwtModule.register({
            secret: jwtConstants.secret,
            signOptions: { expiresIn: '1day' },
        }),
        DockerModule,
    ],
    providers: [HydraHeadService, OgmiosClientService, HydraConfig],
    controllers: [HydraHeadController],
    exports: [HydraHeadService, HydraConfig],
})
export class HydraHeadsModule {}
