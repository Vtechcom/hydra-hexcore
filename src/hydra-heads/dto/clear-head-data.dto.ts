import { ApiProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';

export class ClearHeadDataDto {
    @ApiProperty({
        description: 'Ids of Hydra Heads to clear data',
        example: [1, 2, 3],
    })
    @IsArray({ message: 'Ids must be an array of numbers' })
    ids: number[];
}
