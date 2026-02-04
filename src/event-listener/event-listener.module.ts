import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ActiveHydraHeadListener } from './listeners/active-hydra-head.listener';
import { HydraHubApiService } from 'src/hydra-hub/hydrahub-api.service';

import { AxiosModule } from 'src/axios';

@Module({
    imports: [AxiosModule],
    providers: [ActiveHydraHeadListener, HydraHubApiService],
    exports: [ActiveHydraHeadListener],
})
export class EventListenerModule {}
