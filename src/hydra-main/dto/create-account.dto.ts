import { ApiProperty } from '@nestjs/swagger';
import { generateMnemonic } from 'bip39';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateAccountDto {
    @ApiProperty({
        description: 'Mnemonic for the new account',
        example: generateMnemonic(128)
    })
    @IsString()
    @IsNotEmpty()
    mnemonic: string;
}
