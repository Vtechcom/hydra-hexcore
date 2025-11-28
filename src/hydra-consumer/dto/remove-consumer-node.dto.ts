import { IsNotEmpty, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class RemoveConsumerNodeDto {
    @IsNotEmpty()
    @IsNumber()
    @ApiProperty({
        example: 1,
        description: 'ID of the mapper',
    })
    mapperId: number;
}
