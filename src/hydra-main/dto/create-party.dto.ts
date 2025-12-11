import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePartyDto {
  @ApiProperty({ description: 'Number of nodes for the party', example: 1 })
  @IsNumber()
  nodes: number;

  @ApiProperty({ description: 'Description of the party', example: 'Test Party' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'List of Cardano Account IDs', example: [1] })
  @IsArray({ context: { each: 'number' } })
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  cardanoAccountIds: number[];
}
