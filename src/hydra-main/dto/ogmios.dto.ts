import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for protocol parameters response
 * All BigInt fields are represented as strings for JSON serialization
 */
export class ProtocolParametersDto {
    @ApiProperty({ description: 'Maximum block body size in bytes', type: 'string' })
    maxBlockBodySize: string;

    @ApiProperty({ description: 'Maximum transaction size in bytes', type: 'string' })
    maxTransactionSize: string;

    @ApiProperty({ description: 'Minimum fee coefficient A', type: 'string' })
    minFeeCoefficient: string;

    @ApiProperty({ description: 'Minimum fee constant B', type: 'string' })
    minFeeConstant: string;

    @ApiProperty({ description: 'Minimum UTxO value', type: 'string' })
    minUtxoValue: string;

    @ApiProperty({ description: 'Pool deposit', type: 'string' })
    stakePoolDeposit: string;

    @ApiProperty({ description: 'Key deposit', type: 'string' })
    stakeKeyDeposit: string;

    // Add other protocol parameter fields as needed
    // Note: All numeric fields that can be BigInt should be typed as string
}

/**
 * Generic response wrapper for data that might contain BigInt values
 */
export class BigIntResponseDto<T> {
    @ApiProperty({ description: 'The actual response data' })
    data: T;

    @ApiProperty({
        description: 'List of field paths that contained BigInt values',
        required: false,
        type: [String],
    })
    bigIntFields?: string[];
}

/**
 * Health check response
 */
export class HealthResponseDto {
    @ApiProperty({ description: 'Whether the service is healthy' })
    healthy: boolean;

    @ApiProperty({ description: 'Timestamp of the health check' })
    timestamp: string;
}
