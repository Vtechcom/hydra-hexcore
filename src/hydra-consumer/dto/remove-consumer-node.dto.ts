import { IsNotEmpty, IsNumber } from 'class-validator';

export class RemoveConsumerNodeDto {
    @IsNotEmpty()
    @IsNumber()
    mapperId: number;
}
