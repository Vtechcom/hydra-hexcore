import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class ShareConsumerNodeDto {
    @IsNotEmpty()
    @IsNumber()
    @ApiProperty({
        example: 1,
    })
    consumerId: number;

    @IsNotEmpty()
    @IsNumber()
    @ApiProperty({
        example: 1,
    })
    hydraNodeId: number;
}
