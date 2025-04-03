import { IsNotEmpty } from 'class-validator';

import { IsString } from 'class-validator';

export class AdminLoginDto {
    @IsString()
    @IsNotEmpty()
    username: string;

    @IsString()
    @IsNotEmpty()
    password: string;
}
