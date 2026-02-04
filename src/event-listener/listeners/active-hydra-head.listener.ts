import { HydraHubApiService } from 'src/hydra-hub/hydrahub-api.service';
import { OnEvent } from '@nestjs/event-emitter';
import { EventEnum } from '../enums/event.enum';
import { ActiveHydraHeadEvent } from '../events/active-hydra-head.event';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ActiveHydraHeadListener {
    private readonly logger = new Logger(ActiveHydraHeadListener.name);

    constructor(private readonly hydraHubApiService: HydraHubApiService) {}

    @OnEvent(EventEnum.ACTIVE_HYDRA_HEAD)
    async handleActiveHydraHeadEvent(event: ActiveHydraHeadEvent) {
        this.logger.log(`Event is running - headId: ${event.headId}, status: ${event.status}`);
        try {
            await this.hydraHubApiService.asyncHydraHead({ headId: event.headId, status: event.status });
            this.logger.log(`Successfully sent async head status for headId: ${event.headId}`);
        } catch (error) {
            this.logger.error(`Failed to send async head status for headId: ${event.headId}: ${error.message}`);
        }
    }
}
