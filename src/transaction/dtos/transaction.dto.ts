import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsMongoId } from 'class-validator';

export class CreatePaymentIntentDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayNotEmpty()
  @IsMongoId({ each: true })
  companyIds: string[];
}

export class SucceedPaymentDto {
  @ApiProperty({
    description: 'Payment intent ID',
    example: 'pi_3QB9UgBq2j7AgkT30Pyps3iB',
  })
  id: string;

  @ApiProperty({
    description: 'Type of the object (e.g., payment_intent)',
    example: 'payment_intent',
  })
  object: string;

  @ApiProperty({ description: 'Total amount in cents', example: 10000 })
  amount: number;

  @ApiPropertyOptional({
    description: 'Optional details about the amount (e.g., tips)',
    example: { tip: {} },
  })
  amount_details?: { tip?: Record<string, any> };

  @ApiPropertyOptional({
    description: 'Optional automatic payment methods',
    example: { allow_redirects: 'always', enabled: true },
  })
  automatic_payment_methods?: { allow_redirects: string; enabled: boolean };

  @ApiPropertyOptional({
    description: 'Timestamp when canceled, or null if not canceled',
    example: null,
  })
  canceled_at?: number | null;

  @ApiPropertyOptional({
    description: 'Reason for cancellation, or null',
    example: null,
  })
  cancellation_reason?: string | null;

  @ApiProperty({
    description: 'Capture method (e.g., automatic_async)',
    example: 'automatic_async',
  })
  capture_method: string;

  @ApiProperty({
    description: 'Client secret for confirming payment intent',
    example: 'pi_3QB9UgBq2j7AgkT30Pyps3iB_secret_6uIJ7Sj9ZVtpGm0pkxkv5ssWF',
  })
  client_secret: string;

  @ApiProperty({
    description: 'Method used for confirmation (e.g., automatic)',
    example: 'automatic',
  })
  confirmation_method: string;

  @ApiProperty({
    description: 'Timestamp when the payment intent was created',
    example: 1729232222,
  })
  created: number;

  @ApiProperty({ description: 'Currency code (e.g., usd)', example: 'usd' })
  currency: string;

  @ApiPropertyOptional({
    description: 'Optional description for the payment',
    example: null,
  })
  description?: string | null;

  @ApiPropertyOptional({
    description: 'Last error encountered during payment, or null',
    example: null,
  })
  last_payment_error?: string | null;

  @ApiProperty({
    description: 'Whether the payment is in live mode or not',
    example: false,
  })
  livemode: boolean;

  @ApiPropertyOptional({
    description: 'Action required for the payment, or null',
    example: null,
  })
  next_action?: string | null;

  @ApiProperty({
    description: 'Payment method ID used',
    example: 'pm_1QB9VXBq2j7AgkT3u61JgtuU',
  })
  payment_method: string;

  @ApiProperty({
    description: 'Payment method configuration details',
    example: { id: 'pmc_1KX1joBq2j7AgkT3DNORQQVV', parent: null },
  })
  payment_method_configuration_details: { id: string; parent?: string | null };

  @ApiProperty({
    description: 'Types of payment methods (e.g., card)',
    example: ['card'],
  })
  payment_method_types: string[];

  @ApiPropertyOptional({
    description: 'Processing status, or null',
    example: null,
  })
  processing?: string | null;

  @ApiPropertyOptional({ description: 'Receipt email, or null', example: null })
  receipt_email?: string | null;

  @ApiPropertyOptional({
    description: 'Whether to set up for future usage, or null',
    example: null,
  })
  setup_future_usage?: string | null;

  @ApiPropertyOptional({
    description: 'Shipping details, or null',
    example: null,
  })
  shipping?: string | null;

  @ApiPropertyOptional({
    description: 'Source of payment, or null',
    example: null,
  })
  source?: string | null;

  @ApiProperty({
    description: 'Status of the payment (e.g., succeeded)',
    example: 'succeeded',
  })
  status: string;
}
