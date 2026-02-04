export class ActiveHydraHeadEvent {
    constructor(
        public readonly headId: number,
        public readonly status: string,
    ) { }
}
