import { IsString, IsNotEmpty } from 'class-validator';

export class ConsumerLoginDto {
    @IsString()
    @IsNotEmpty()
    address: string;

    @IsString()
    @IsNotEmpty()
    password: string;
}
