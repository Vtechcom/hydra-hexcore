import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty, IsStrongPassword } from 'class-validator';

export class CreateConsumerDto {
    @ApiProperty({
        description: 'Cardano address of the consumer',
        example: 'addr1qx2fxv2umyhttkxyxp8x0dlpdt3k6cwng5pxj3jhsydzer3jcu5d8ps7zex2k2xt3uqxgjqnnjhl2hx3vx0j4w0q3q8qy8q',
    })
    @IsNotEmpty()
    @IsString()
    address: string;

    @ApiProperty({
        description: 'Avatar of the consumer',
        example: 'https://example.com/avatar.png',
    })
    @IsOptional()
    @IsString()
    avatar?: string;

    @ApiProperty({
        description: 'Registration transaction of the consumer',
        example: 'tx1qx2fxv2umyhttkxyxp8x0dlpdt3k6cwng5pxj3jhsydzer3jcu5d8ps7zex2k2xt3uqxgjqnnjhl2hx3vx0j4w0q3q8qy8q',
    })
    @IsOptional()
    @IsString()
    registrationTx?: string;

    @ApiProperty({
        example: 'StrongPassword123!',
        minLength: 8,
        maxLength: 32,
        format: 'password',
        description:
            'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    })
    @IsNotEmpty()
    @IsString()
    @IsStrongPassword()
    password: string;
}
