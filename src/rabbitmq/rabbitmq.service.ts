import * as amqp from 'amqplib';
import { Injectable, Inject, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { RabbitMqConfigInterface, RABBITMQ_CONFIG } from '../config/rabbitmq.config';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
    private connection: amqp.Connection | null = null;
    private channel: amqp.Channel | null = null;
    private isConnecting = false;
    private reconnectAttempts = 0;
    private readonly MAX_RECONNECT_DELAY_MS = 30_000;
    private readonly BASE_RECONNECT_DELAY_MS = 1_000;
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    constructor(
        @Inject(RABBITMQ_CONFIG) private readonly config: RabbitMqConfigInterface,
        private readonly logger: Logger,
    ) {}

    async onModuleInit() {
        if (!this.config.enabled) {
            this.logger.warn('RabbitMQ is disabled in the configuration', 'RabbitMQService');
            return;
        }
        await this.connect();
    }

    /** Establish connection + channel, register error/close handlers for auto-reconnect */
    private async connect(): Promise<void> {
        if (this.isConnecting) return;
        this.isConnecting = true;

        try {
            this.connection = await amqp.connect(this.config.uri);
            this.channel = await this.connection.createChannel();

            // Queue setup (backward compat)
            await this.channel.assertQueue(this.config.queue, { durable: this.config.queueDurable });
            this.channel.prefetch(this.config.prefetchCount);

            // Exchange setup for monitoring agent (topic, non-durable as per spec)
            await this.channel.assertExchange(this.config.exchange, 'topic', { durable: false });

            // Binding queue to exchange with routing key pattern
            await this.channel.bindQueue(this.config.queue, this.config.exchange, 'metrics.*');

            this.reconnectAttempts = 0;
            this.isConnecting = false;
            this.logger.log('Connected to RabbitMQ', 'RabbitMQService');

            // Auto-reconnect on unexpected close / error
            this.connection.on('error', err => {
                this.logger.error(`RabbitMQ connection error: ${err.message}`, undefined, 'RabbitMQService');
            });
            this.connection.on('close', () => {
                this.logger.warn('RabbitMQ connection closed, scheduling reconnect…', 'RabbitMQService');
                this.channel = null;
                this.connection = null;
                this.scheduleReconnect();
            });
        } catch (error) {
            this.isConnecting = false;
            this.logger.error(`Failed to connect to RabbitMQ: ${error.message}`, undefined, 'RabbitMQService');
            this.scheduleReconnect();
        }
    }

    /** Exponential back-off reconnect */
    private scheduleReconnect(): void {
        if (this.reconnectTimer) return; // already scheduled

        const delay = Math.min(
            this.BASE_RECONNECT_DELAY_MS * Math.pow(2, this.reconnectAttempts),
            this.MAX_RECONNECT_DELAY_MS,
        );
        this.reconnectAttempts++;
        this.logger.warn(
            `Reconnecting to RabbitMQ in ${delay}ms (attempt #${this.reconnectAttempts})…`,
            'RabbitMQService',
        );
        this.reconnectTimer = setTimeout(async () => {
            this.reconnectTimer = null;
            await this.connect();
        }, delay);
    }

    /** Check if channel is ready */
    isChannelReady(): boolean {
        return this.channel !== null;
    }

    // ───────── Queue helpers (existing behaviour) ─────────

    async sendToQueue(message: any) {
        if (!this.channel) {
            this.logger.error('RabbitMQ channel is not initialized', undefined, 'RabbitMQService');
            return false;
        }
        try {
            const bufferMessage = Buffer.from(JSON.stringify(message));
            this.channel.sendToQueue(this.config.queue, bufferMessage, { persistent: this.config.queueDurable });
            return true;
        } catch (error) {
            this.logger.error(`Failed to send message to RabbitMQ: ${error.message}`, undefined, 'RabbitMQService');
            return false;
        }
    }

    async consumeFromQueue(onMessage: (msg: amqp.ConsumeMessage | null) => void) {
        if (!this.channel) {
            this.logger.error('RabbitMQ channel is not initialized', undefined, 'RabbitMQService');
            return;
        }
        try {
            await this.channel.consume(this.config.queue, onMessage, { noAck: this.config.noAck });
            this.logger.log(`Consuming messages from queue ${this.config.queue}`, 'RabbitMQService');
        } catch (error) {
            this.logger.error(`Failed to consume messages: ${error.message}`, undefined, 'RabbitMQService');
        }
    }

    // ───────── Exchange helpers (monitoring agent) ─────────

    /**
     * Publish a message to the configured topic exchange.
     * @returns true if published successfully, false otherwise.
     */
    publishToExchange(routingKey: string, message: any): boolean {
        if (!this.channel) {
            this.logger.error('RabbitMQ channel is not initialized – cannot publish', undefined, 'RabbitMQService');
            return false;
        }
        try {
            const buffer = Buffer.from(JSON.stringify(message));
            return this.channel.publish(this.config.exchange, routingKey, buffer, {
                contentType: 'application/json',
            });
        } catch (error) {
            this.logger.error(`Failed to publish to exchange: ${error.message}`, undefined, 'RabbitMQService');
            return false;
        }
    }

    // ───────── Lifecycle ─────────

    async onModuleDestroy() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        try {
            if (this.channel) await this.channel.close();
            if (this.connection) await this.connection.close();
            this.logger.log('RabbitMQ connection closed', 'RabbitMQService');
        } catch (error) {
            this.logger.error(`Failed to close RabbitMQ connection: ${error.message}`, undefined, 'RabbitMQService');
        }
    }
}
