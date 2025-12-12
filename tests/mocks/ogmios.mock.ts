import { Injectable } from '@nestjs/common';

/**
 * Mock Ogmios service for testing
 * Prevents actual Ogmios API calls during tests
 */
@Injectable()
export class MockOgmiosService {
    async onModuleInit() {
        // Do nothing - skip real initialization
    }

    async onModuleDestroy() {
        // Do nothing
    }

    async test() {
        return { connected: true, mock: true };
    }

    async queryTip() {
        return {
            slot: 1000000,
            hash: 'mock-hash',
            blockNo: 50000,
        };
    }

    async getProtocolParameters() {
        return {
            minFeeA: 44,
            minFeeB: 155381,
            maxTxSize: 16384,
            maxBlockHeaderSize: 1100,
            keyDeposit: 2000000,
            poolDeposit: 500000000,
            minPoolCost: 340000000,
            priceMem: 0.0577,
            priceStep: 0.0000721,
            maxTxExecutionUnits: { mem: 14000000, steps: 10000000000 },
            maxBlockExecutionUnits: { mem: 62000000, steps: 20000000000 },
            maxValueSize: 5000,
            collateralPercentage: 150,
            maxCollateralInputs: 3,
            coinsPerUtxoWord: 34482,
        };
    }

    async queryUtxoByAddress() {
        return [];
    }
}
