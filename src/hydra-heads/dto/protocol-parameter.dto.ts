export class ProtocolParameterDto {
    maxTxSize: number;
    maxBlockBodySize: number;
    txFeeFixed: number;
    txFeePerByte: number;
    executionUnitPrices: {
        priceMemory: number;
        priceSteps: number;
    };
}
