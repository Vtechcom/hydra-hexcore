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
        try {
            await this.hydraHubApiService.syncHydraHeadStatus({
                headId: event.headId,
                status: event.status,
                ...(event.nodes && { nodes: event.nodes }),
            });
            this.logger.log(`Successfully sent sync head status for headId: ${event.headId}`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Failed to send sync head status for headId: ${event.headId}: ${errorMessage}`);
        }
    }
}
