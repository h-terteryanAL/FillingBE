import { AccessTokenGuard } from '@/auth/guards/access-token.guard';
import { Body, Controller, Patch, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiNotFoundResponse,
  ApiTags,
} from '@nestjs/swagger';
import { transactionMessages } from './constants';
import {
  CreatePaymentIntentDto,
  SucceedPaymentDto,
} from './dtos/transaction.dto';
import { TransactionService } from './transaction.service';

@ApiTags('transaction')
@Controller('transaction')
export class TransactionController {
  constructor(private transactionService: TransactionService) {}

  @Post('create-payment-intent')
  @ApiBody({ type: CreatePaymentIntentDto })
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  async createPaymentIntent(@Body() body: CreatePaymentIntentDto) {
    const { companyIds } = body;

    return this.transactionService.createPaymentIntent(
      companyIds as unknown as string[],
    );
  }

  @Patch('payment-succeed')
  @ApiBody({ type: SucceedPaymentDto })
  @UseGuards(AccessTokenGuard)
  @ApiNotFoundResponse({ description: transactionMessages.notFound })
  async updatePaymentStatus(@Body() body: SucceedPaymentDto) {
    return this.transactionService.updateTransactionStatus(body);
  }
}
