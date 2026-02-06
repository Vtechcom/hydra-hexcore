import { HydraNode } from 'src/hydra-main/entities/HydraNode.entity';

export class ActiveHydraHeadEvent {
    constructor(
        public readonly headId: number,
        public readonly status: string,
        public readonly nodes?: (HydraNode & { status: string })[],
    ) {}
}
