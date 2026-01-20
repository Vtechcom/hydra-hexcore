import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

class TransactionDto {
    @IsString()
    @IsOptional()
    txId: string;

    @IsString()
    @IsEnum(['Tx ConwayEra', 'Unwitnessed Tx ConwayEra', 'Witnessed Tx ConwayEra'])
    type: string;

    @IsString()
    cborHex: string;

    @IsString()
    description: string;
}

export class SubmitTxHydraDto {
    @IsNumber()
    partyId: number;

    @IsNumber()
    hydraHeadId: number;

    @ValidateNested()
    @Type(() => TransactionDto)
    transaction: TransactionDto;
}
