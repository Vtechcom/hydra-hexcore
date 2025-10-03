import { ClassSerializerInterceptor, Controller, Get, Param, Query, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { OgmiosClientService } from './ogmios-client.service';
import { BigIntInterceptor, SimpleBigIntInterceptor } from '../common/interceptors/bigint.interceptor';
import { ProtocolParametersDto, BigIntResponseDto, HealthResponseDto } from '../dto/ogmios.dto';
import { Origin, Point } from '@cardano-ogmios/schema';

@ApiTags('Ogmios')
@UseInterceptors(ClassSerializerInterceptor)
@Controller('ogmios')
export class OgmiosController {
    constructor(private readonly ogmiosClientService: OgmiosClientService) {}

    @Get('test')
    @ApiOperation({ summary: 'Test Ogmios connection and get protocol parameters' })
    @ApiResponse({ status: 200, description: 'Protocol parameters retrieved successfully' })
    @UseInterceptors(SimpleBigIntInterceptor)
    async test() {
        return await this.ogmiosClientService.test();
    }

    @Get('protocol-parameters')
    @ApiOperation({ summary: 'Get protocol parameters with BigInt metadata' })
    @ApiResponse({
        status: 200,
        description: 'Protocol parameters with BigInt field information',
        type: BigIntResponseDto,
    })
    @UseInterceptors(BigIntInterceptor)
    async getProtocolParameters() {
        // This will return raw data with BigInt, interceptor will handle conversion
        return await this.ogmiosClientService.getRawProtocolParameters();
    }

    @Get('protocol-parameters-simple')
    @ApiOperation({ summary: 'Get protocol parameters (BigInt converted to strings)' })
    @ApiResponse({
        status: 200,
        description: 'Protocol parameters with BigInt values as strings',
        type: ProtocolParametersDto,
    })
    async getProtocolParametersSimple() {
        // This returns pre-converted data (BigInt already converted to strings)
        return await this.ogmiosClientService.getProtocolParameters();
    }

    @Get('health')
    @ApiOperation({ summary: 'Check Ogmios service health' })
    @ApiResponse({
        status: 200,
        description: 'Health check result',
        type: HealthResponseDto,
    })
    async getHealth(): Promise<HealthResponseDto> {
        return {
            healthy: await this.ogmiosClientService.isHealthy(),
            timestamp: new Date().toISOString(),
        };
    }

    @Get('query-tip')
    @ApiOperation({ summary: 'Get current tip' })
    @ApiResponse({
        status: 200,
        description: 'Current tip',
        type: Object, // Point type from Ogmios schema
    })
    async queryTip() {
        return await this.ogmiosClientService.queryTip();
    }

    @Get('addresses/utxo')
    @ApiOperation({ summary: 'Query UTxO set by addresses' })
    @ApiResponse({
        status: 200,
        description: 'UTxO set',
        type: Object, // Define the UTxO set response type
    })
    async queryUtxoByAddresses(@Query('addresses') addresses: string[] | string) {
        // If a single address is provided as a string, convert it to an array
        const addressArray = Array.isArray(addresses) ? addresses : [addresses];
        return await this.ogmiosClientService.queryUtxo({ addresses: addressArray });
    }

    @Get('address/:address/utxo')
    @ApiOperation({ summary: 'Query UTxO set' })
    @ApiResponse({
        status: 200,
        description: 'UTxO set',
        type: Object, // Define the UTxO set response type
    })
    async queryUtxoByAddress(@Param('address') address: string) {
        return await this.ogmiosClientService.queryUtxoByAddress(address);
    }

    @Get('tx/:txHash/utxo')
    @ApiOperation({ summary: 'Query transaction by hash' })
    @ApiResponse({
        status: 200,
        description: 'Transaction details',
        type: Object, // Define the transaction response type
    })
    async queryTransaction(@Param('txHash') txHash: `${string}#${number}`) {
        const rs = await this.ogmiosClientService.queryUtxo({ txHashes: [txHash] });
        if (rs && rs.length > 0) {
            return rs[0];
        }
        return null;
    }

    @Get('txs')
    @ApiOperation({ summary: 'Query transactions by hashes' })
    @ApiResponse({
        status: 200,
        description: 'Transaction details',
        type: Object, // Define the transaction response type
    })
    async queryTransactions(@Query('txHashes') txHashes: `${string}#${number}`[]) {
        return await this.ogmiosClientService.queryUtxo({ txHashes });
    }
}
