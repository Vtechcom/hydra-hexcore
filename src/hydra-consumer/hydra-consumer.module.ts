import { Module } from '@nestjs/common';
import { HydraConsumerController } from './hydra-consumer.controller';
import { HydraConsumerService } from './hydra-consumer.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsumerKeyMapper } from './entities/ConsumerKeyMapper.entity';
import { Consumer } from './entities/Consumer.entity';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from 'src/constants';
import { HydraMainModule } from 'src/hydra-main/hydra-main.module';
@Module({
    imports: [
        TypeOrmModule.forFeature([ConsumerKeyMapper, Consumer]),
        JwtModule.register({
            secret: jwtConstants.secret,
            signOptions: { expiresIn: '1day' },
        }),
        HydraMainModule,
    ],
    controllers: [HydraConsumerController],
    providers: [HydraConsumerService],
    exports: [HydraConsumerService, JwtModule],
})
export class HydraConsumerModule {}
