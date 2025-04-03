import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { ConsumerStatus } from '../entities/Consumer.entity';

export class UpdateConsumerDto {
    @IsNumber()
    id: number;

    @IsOptional()
    @IsString()
    avatar?: string;

    @IsOptional()
    @IsString()
    password?: string;

    @IsOptional()
    @IsEnum(ConsumerStatus)
    status?: ConsumerStatus;
}
