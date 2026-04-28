import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class CreateAvailabilitySlotDto {
  @ApiProperty({
    description: 'Slot start time in ISO 8601 format.',
    example: '2026-05-01T09:00:00.000Z',
  })
  @IsDateString()
  startTime!: string;

  @ApiProperty({
    description: 'Slot end time in ISO 8601 format.',
    example: '2026-05-01T10:00:00.000Z',
  })
  @IsDateString()
  endTime!: string;
}
