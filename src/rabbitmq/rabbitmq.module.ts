import { Logger, Module } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';
import { RabbitMqConfig } from '../config/rabbitmq.config';

@Module({
    providers: [RabbitMqConfig, Logger, RabbitMQService],
    exports: [RabbitMQService],
})
export class RabbitMQModule {}
