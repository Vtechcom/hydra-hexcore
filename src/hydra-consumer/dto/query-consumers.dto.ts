import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ConsumerStatus } from '../entities/Consumer.entity';

export class QueryConsumersDto {
    @IsOptional()
    @IsString()
    @IsEnum(ConsumerStatus)
    status?: ConsumerStatus;

    @IsOptional()
    @IsString()
    address?: string;
}
