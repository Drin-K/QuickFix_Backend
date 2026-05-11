import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class CreateConversationDto {
  @ApiProperty({
    example: 12,
    description:
      'Marketplace service id used to resolve the provider and provider tenant.',
  })
  @IsInt()
  @Min(1)
  serviceId!: number;
}
