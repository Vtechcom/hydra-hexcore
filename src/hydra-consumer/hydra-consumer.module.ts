import { Module } from '@nestjs/common';
import { HydraConsumerController } from './hydra-consumer.controller';
import { HydraConsumerService } from './hydra-consumer.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsumerKeyMapper } from './entities/ConsumerKeyMapper.entity';
import { Consumer } from './entities/Consumer.entity';
@Module({
    imports: [TypeOrmModule.forFeature([ConsumerKeyMapper, Consumer])],
    controllers: [HydraConsumerController],
    providers: [HydraConsumerService],
    exports: [HydraConsumerService],
})
export class HydraConsumerModule {}
