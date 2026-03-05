/**
 * Payload format required by Hub (see spec §3.2).
 * No additional fields allowed.
 */
export interface MetricsPayload {
    hub_api_key: string;
    cpu: number;
    ram: number;
    network: {
        rx: number;
        tx: number;
        latency: number;
    };
    timestamp: number;
}
