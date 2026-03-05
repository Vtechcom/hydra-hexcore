import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { SystemMetricsCollector } from './system-metrics.collector';
import { MetricsPayload } from './interfaces';

/**
 * Monitoring Agent – collects system metrics and publishes them to
 * RabbitMQ topic exchange `provider.metrics` every SEND_INTERVAL_MS.
 *
 * Routing key: metrics.{webhook_api_key}
 *
 * Spec references:
 *  - §3 Responsibilities of Provider
 *  - §4 RabbitMQ Configuration (exchange type: topic, durable: false)
 *  - §5 Sending Interval Rules (min 1 000 ms, retry with exponential backoff)
 *  - §9 Security Requirements (no WEBHOOK_API_KEY in logs)
 */
@Injectable()
export class MonitoringAgentService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(MonitoringAgentService.name);

    private intervalHandle: ReturnType<typeof setInterval> | null = null;
    private retryTimer: ReturnType<typeof setTimeout> | null = null;
    private retryAttempts = 0;
    private readonly MAX_RETRY_DELAY_MS = 16_000;
    private readonly BASE_RETRY_DELAY_MS = 500;

    /** Resolved once from ConfigService */
    private readonly hubApiKey: string;
    private readonly sendIntervalMs: number;
    private readonly exchange: string;
    private readonly routingKey: string;
    private readonly rabbitMQReady: boolean = false;

    constructor(
        private readonly configService: ConfigService,
        private readonly rabbitMQService: RabbitMQService,
        private readonly metricsCollector: SystemMetricsCollector,
    ) {
        this.hubApiKey = this.configService.get<string>('monitoringAgent.hubApiKey', '');
        this.sendIntervalMs = this.configService.get<number>('monitoringAgent.sendIntervalMs', 2000);
        this.exchange = this.configService.get<string>('rabbitmq.exchange', 'provider.metrics');
        this.routingKey = `metrics.${this.hubApiKey}`;
        this.rabbitMQReady = this.configService.get<boolean>('rabbitmq.enabled', false);
    }

    async onModuleInit() {
        if (!this.rabbitMQReady) {
            return;
        }
        if (!this.hubApiKey) {
            this.logger.error('HUB_API_KEY is not configured – Monitoring Agent will not start');
            return;
        }

        this.logger.log(
            `Monitoring Agent starting – interval ${this.sendIntervalMs}ms, exchange "${this.exchange}"`,
        );
        this.startInterval();
    }

    onModuleDestroy() {
        this.stopInterval();
        if (this.retryTimer) {
            clearTimeout(this.retryTimer);
            this.retryTimer = null;
        }
        this.logger.log('Monitoring Agent stopped');
    }

    // ───────── Core loop ─────────

    private startInterval(): void {
        // First tick immediately
        this.tick();
        this.intervalHandle = setInterval(() => this.tick(), this.sendIntervalMs);
    }

    private stopInterval(): void {
        if (this.intervalHandle) {
            clearInterval(this.intervalHandle);
            this.intervalHandle = null;
        }
    }

    private async tick(): Promise<void> {
        try {
            const payload = await this.collectMetrics();
            const ok = this.publish(payload);

            if (ok) {
                this.retryAttempts = 0; // reset on success
            } else {
                this.scheduleRetry();
            }
        } catch (error) {
            this.logger.error(`Metrics tick error: ${error.message}`);
            this.scheduleRetry();
        }
    }

    // ───────── Collect ─────────

    private async collectMetrics(): Promise<MetricsPayload> {
        const cpu = await this.metricsCollector.getCpuUsage();
        const ram = this.metricsCollector.getRamUsage();
        const network = this.metricsCollector.getNetworkDelta();
        const latency = this.metricsCollector.getNetworkLatency();

        return {
            hub_api_key: this.hubApiKey,
            cpu,
            ram,
            network: {
                rx: network.rx,
                tx: network.tx,
                latency,
            },
            timestamp: Date.now(),
        };
    }

    // ───────── Publish ─────────

    private publish(payload: MetricsPayload): boolean {
        if (!this.rabbitMQService.isChannelReady()) {
            this.logger.warn('RabbitMQ channel not ready – skipping publish');
            return false;
        }
        return this.rabbitMQService.publishToExchange(this.routingKey, payload);
    }

    // ───────── Retry with exponential backoff (spec §5) ─────────

    private scheduleRetry(): void {
        if (this.retryTimer) return; // already in retry

        const delay = Math.min(
            this.BASE_RETRY_DELAY_MS * Math.pow(2, this.retryAttempts),
            this.MAX_RETRY_DELAY_MS,
        );
        this.retryAttempts++;
        this.logger.warn(`Publish failed – retrying in ${delay}ms (attempt #${this.retryAttempts})`);

        this.retryTimer = setTimeout(async () => {
            this.retryTimer = null;
            await this.tick();
        }, delay);
    }
}
