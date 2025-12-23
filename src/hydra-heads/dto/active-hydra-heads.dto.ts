import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class ActiveHydraHeadsDto {
    @ApiProperty({ description: 'ID of the hydra head to be activated', example: 1 })
    @IsNumber()
    id: number;
}
