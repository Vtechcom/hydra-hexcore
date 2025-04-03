import { IsString, IsOptional, IsNotEmpty, IsStrongPassword } from 'class-validator';

export class CreateConsumerDto {
    @IsNotEmpty()
    @IsString()
    address: string;

    @IsOptional()
    @IsString()
    avatar?: string;

    @IsOptional()
    @IsString()
    registrationTx?: string;

    @IsNotEmpty()
    @IsString()
    @IsStrongPassword()
    password: string;
}
