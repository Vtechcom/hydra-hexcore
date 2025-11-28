import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { ConsumerStatus } from '../entities/Consumer.entity';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateConsumerDto {
    @ApiProperty({
        example: 1,
        description: 'ID of the consumer',
    })
    @IsNumber()
    id: number;

    @IsOptional()
    @IsString()
    @ApiProperty({
        example: 'https://example.com/avatar.png',
        description: 'Avatar of the consumer',
    })
    avatar?: string;

    @IsOptional()
    @IsString()
    @ApiProperty({
        example: 'StrongPassword123!',
        description: 'Password of the consumer',
    })
    password?: string;

    @IsOptional()
    @IsEnum(ConsumerStatus)
    @ApiProperty({
        example: ConsumerStatus.ACTIVE,
        description: 'Status of the consumer',
    })
    status?: ConsumerStatus;
}
