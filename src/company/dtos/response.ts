import { ApiProperty } from '@nestjs/swagger';

export class ResponseMessageDto {
  @ApiProperty()
  message: string;
}
