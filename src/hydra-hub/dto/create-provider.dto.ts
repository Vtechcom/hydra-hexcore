import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export enum ConnectionType {
    CARDANO_NODE = 'cardano_node',
    BLOCKFROST = 'blockfrost',
}

export enum CardanoNetwork {
    MAINNET = 'mainnet',
    PREPROD = 'preprod',
    PREVIEW = 'preview',
}

export class CreateProviderDto {
    @ApiProperty({
        example: 'Alpha Infrastructure',
        description: 'Tên hiển thị của provider',
        maxLength: 255,
    })
    @IsNotEmpty()
    @IsString()
    @MaxLength(255)
    name: string;

    @ApiProperty({
        example: 'https://alpha-infra.io/logo.png',
        description: 'URL logo của provider',
        maxLength: 255,
    })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    logo?: string;

    @ApiProperty({
        example: 'https://alpha-infra.io',
        description: 'URL website của provider',
        maxLength: 255,
    })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    url?: string;

    @ApiProperty({
        example: '103.45.67.89',
        description: 'Địa chỉ IP của server provider',
        maxLength: 30,
    })
    @IsNotEmpty()
    @IsString()
    @MaxLength(30)
    ip: string;

    @ApiProperty({
        enum: ConnectionType,
        example: ConnectionType.CARDANO_NODE,
        description: 'Loại kết nối: cardano_node hoặc blockfrost',
    })
    @IsNotEmpty()
    @IsEnum(ConnectionType)
    connectionType: ConnectionType;

    @ApiProperty({
        enum: CardanoNetwork,
        example: CardanoNetwork.PREPROD,
        description: 'Mạng Cardano: mainnet, preprod, hoặc preview',
    })
    @IsNotEmpty()
    @IsEnum(CardanoNetwork)
    network: CardanoNetwork;

    @ApiProperty({ example: 'node.alpha-infra.io', description: 'Tên miền của provider' })
    @IsNotEmpty()
    @IsString()
    domain: string;

    @ApiProperty({ example: 'admin-access-token', description: 'Access token của admin' })
    @IsNotEmpty()
    @IsString()
    accessToken: string;

    @IsEmail()
    @IsNotEmpty()
    @ApiProperty({
        example: 'test@example.com',
        description: 'The email address of the provider',
        required: true,
    })
    email: string;
}
