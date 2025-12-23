import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsNumber, IsOptional, IsString } from 'class-validator';
import { HydraHeadKeys } from '../interfaces/hydra-head-keys.type';
import { ProtocolParameterDto } from './protocol-parameter.dto';

export class CreateHydraHeadsDto {
  @ApiProperty({ description: 'Description of the hydra head', example: 'Test Hydra Heads' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'List of Hydra Head Keys', example: [{
    hydraHeadVkey: 'hydra_head_vkey_example',
    hydraHeadSkey: 'hydra_head_skey_example',
    fundVkey: 'fund_vkey_example',
    fundSkey: 'fund_skey_example',
  }], isArray: true })
  @IsArray()
  @ArrayNotEmpty()
  @ApiProperty({ type: [Object] })
  hydraHeadKeys: HydraHeadKeys[];

  @ApiProperty({
    description: 'Contestation period',
    example: 120,
  })
  @IsNumber()
  @IsOptional()
  contestationPeriod?: number;

  @ApiProperty({
    description: 'Deposit period',
    example: 720,
  })
  @IsNumber()
  @IsOptional()
  depositPeriod?: number;

  @ApiProperty({
    description: 'Persistence rotate after (in number of blocks)',
    example: 15000,
  })
  @IsNumber()
  @IsOptional()
  persistenceRotateAfter?: number;

  @ApiProperty({
    description: 'Protocol parameters as JSON object',
    example: {
      maxTxSize: 16384,
      maxBlockBodySize: 65536,
    },
  })
  @IsOptional()
  protocolParameters?: ProtocolParameterDto;
}
