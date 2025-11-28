import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsStrongPassword } from 'class-validator';

export class ConsumerLoginDto {
    @ApiProperty({
        example: 'addr1qx2fxv2umyhttkxyxp8x0dlpdt3k6cwng5pxj3jhsydzer3jcu5d8ps7zex2k2xt3uqxgjqnnjhl2hx3vx0j4w0q3q8qy8q',
        description: 'Cardano address of the consumer',
    })
    @IsString()
    @IsNotEmpty()
    address: string;

    @ApiProperty({
        example: 'StrongPassword123!',
        description: 'Password of the consumer',
    })
    @IsString()
    @IsNotEmpty()
    @IsStrongPassword()
    password: string;
}
