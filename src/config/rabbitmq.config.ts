import { ConfigService } from '@nestjs/config';

export const RABBITMQ_CONFIG = 'RABBITMQ_CONFIG';

export const RabbitMqConfig = {
    provide: RABBITMQ_CONFIG,
    inject: [ConfigService],
    useFactory: (config: ConfigService) => ({
        enabled: config.get<boolean>('rabbitmq.enabled', false),
        uri: config.get<string>('rabbitmq.uri', 'amqp://guest:guest@localhost:5672'),
        exchange: config.get<string>('rabbitmq.exchange', 'provider.metrics'),
        queue: config.get<string>('rabbitmq.queue', 'hexcore.queue'),
        prefetchCount: config.get<number>('rabbitmq.prefetchCount', 1),
        noAck: config.get<boolean>('rabbitmq.noAck', false),
        queueDurable: config.get<boolean>('rabbitmq.queueDurable', true),
    }),
};

export interface RabbitMqConfigInterface extends ReturnType<typeof RabbitMqConfig.useFactory> {}
