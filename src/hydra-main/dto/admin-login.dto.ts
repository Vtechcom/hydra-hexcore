import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

import { IsString } from 'class-validator';

export class AdminLoginDto {
    @ApiProperty({
        description: 'Admin username',
        example: 'admin',
    })
    @IsString()
    @IsNotEmpty()
    username: string;

    @ApiProperty({
        description: 'Admin password',
        example: 'strongpassword123',
    })
    @IsString()
    @IsNotEmpty()
    password: string;
}
