import { Module } from '@nestjs/common';
import { RabbitMQModule } from '../rabbitmq/rabbitmq.module';
import { MonitoringAgentService } from './monitoring-agent.service';
import { SystemMetricsCollector } from './system-metrics.collector';

@Module({
    imports: [RabbitMQModule],
    providers: [SystemMetricsCollector, MonitoringAgentService],
    exports: [MonitoringAgentService],
})
export class MonitoringAgentModule {}
