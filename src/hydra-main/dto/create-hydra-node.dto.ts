import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class CreateHydraNodeDto {
  @ApiProperty({
    description: 'Account ID from which the Hydra node will be created',
    example: 1,
  })
  @IsNumber()
  fromAccountId: number;

  @ApiProperty({
    description: 'Description for the Hydra node',
    example: 'My first Hydra node',
  })
  @IsString()
  description: string;
}
