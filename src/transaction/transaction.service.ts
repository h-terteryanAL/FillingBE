import { CompanyService } from '@/company/company.service';
import { GovernmentService } from '@/government/government.service';
import { MailService } from '@/mail/mail.service';
import { forwardRef, Inject, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import Stripe from 'stripe';
import {
  CurrencyEnum,
  PaymentStatusEnum,
  transactionMessages,
  TransactionTypeEnum,
} from './constants';
import { Transaction, TransactionDocument } from './schemas/transaction.schema';

export class TransactionService {
  private stripe: Stripe;

  constructor(
    @Inject('STRIPE_API_KEY') private readonly apiKey: string,
    @InjectModel(Transaction.name)
    private transactionModel: Model<TransactionDocument>,
    @Inject(forwardRef(() => CompanyService))
    private readonly mailService: MailService,
    private readonly companyService: CompanyService,
    private readonly governmentService: GovernmentService,
  ) {
    this.stripe = new Stripe(this.apiKey, {
      apiVersion: '2024-09-30.acacia',
    });
  }

  private async createOrChangeTransaction(paymentIntent, companyIds) {
    const currentCompaniesTransactions =
      await this.findAllTransactionsForCurrentYear(companyIds);

    if (!currentCompaniesTransactions.length) {
      const transaction = new this.transactionModel({
        transactionId: paymentIntent.id,
        amountPaid: paymentIntent.amount / 100,
        status: paymentIntent.status,
        paymentDate: new Date(paymentIntent.created * 1000),
        paymentMethod: paymentIntent.payment_method_types?.[0] || 'unknown',
        transactionType: TransactionTypeEnum.BOIR_PAYMENT,
        companies: companyIds,
      });
      await transaction.save();
      await this.companyService.addTransactionToCompanies(
        companyIds,
        transaction['id'],
      );
    } else if (currentCompaniesTransactions.length === 1) {
      currentCompaniesTransactions[0].transactionId = paymentIntent.id;
      currentCompaniesTransactions[0].paymentDate = new Date(
        paymentIntent.created * 1000,
      );
      await currentCompaniesTransactions[0].save();
    } else {
      let currentTransaction: TransactionDocument | undefined =
        currentCompaniesTransactions.find(
          (company) => (company.companies = [...companyIds]),
        );

      if (!currentTransaction) {
        const transaction = new this.transactionModel({
          transactionId: paymentIntent.id,
          amountPaid: paymentIntent.amount / 100,
          status: paymentIntent.status,
          paymentDate: new Date(paymentIntent.created * 1000),
          paymentMethod: paymentIntent.payment_method_types?.[0] || 'unknown',
          transactionType: TransactionTypeEnum.BOIR_PAYMENT,
          companies: companyIds,
        });
        await transaction.save();
        await this.companyService.addTransactionToCompanies(
          companyIds,
          transaction['id'],
        );
        currentTransaction = transaction;
      } else {
        currentTransaction.transactionId = paymentIntent.id;
        currentTransaction.paymentDate = new Date(paymentIntent.created * 1000);

        await currentTransaction.save();
      }

      const otherTransactions: {
        transactionId: string;
        companyIds: string[];
      }[] = currentCompaniesTransactions.map((transaction) => {
        if (transaction.transactionId !== currentTransaction.transactionId) {
          return {
            transactionId: transaction.transactionId as string,
            companyIds: transaction.companies as unknown[] as string[],
          };
        }
      });

      await Promise.all(
        otherTransactions.map(async (transaction) => {
          await this.companyService.removeCompanyTransaction(
            transaction.companyIds,
            transaction.transactionId,
          );
        }),
      );

      const transactionsToRemove = otherTransactions.map(
        (data) => data.transactionId,
      );

      await this.removeTransactions(transactionsToRemove);
    }
  }

  async createPaymentIntent(companyIds: string[]) {
    const { companiesAndTheirAmount, totalAmount } =
      await this.companyService.getSubmittedCompaniesAndTheirAmount(companyIds);

    const companyNames = companiesAndTheirAmount.map((company) => company.name);
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: totalAmount * 100,
      currency: CurrencyEnum.USD,
      payment_method_types: ['card'],
      metadata: { companyNames: companyNames.join(','), locale: 'en' },
    });

    await this.createOrChangeTransaction(paymentIntent, companyIds);

    return {
      clientSecret: paymentIntent.client_secret,
      companies: companiesAndTheirAmount,
      totalAmount,
    };
  }

  private async findAllTransactionsForCurrentYear(
    companyIds: string[],
  ): Promise<TransactionDocument[]> {
    const currentYearStart = new Date(new Date().getFullYear(), 0, 1);
    const currentYearEnd = new Date(
      new Date().getFullYear(),
      11,
      31,
      23,
      59,
      59,
    );

    return this.transactionModel
      .find({
        paymentDate: {
          $gte: currentYearStart,
          $lte: currentYearEnd,
        },
        companies: { $in: companyIds },
        status: { $ne: PaymentStatusEnum.SUCCEED },
      })
      .exec();
  }

  private async removeTransactions(transactions: string[]) {
    const result = await this.transactionModel.deleteMany({
      _id: { $in: transactions },
    });

    return result;
  }

  async updateTransactionStatus(paymentIntent: any) {
    const transaction = await this.getTransactionByTId(paymentIntent.id);

    transaction.status = paymentIntent.status;
    await transaction.save();
    const companyIds = await this.companyService.changeCompanyPaidStatus(
      transaction.id,
    );

    await this.governmentService.sendCompanyDataToGovernment(companyIds);
    Promise.all(
      companyIds.map(async (companyId: string) => {
        const company = await this.companyService.getCompanyById(companyId);
        await company.populate({ path: 'user', model: 'User' });
        const fullname = `${company.user.firstName} ${company.user.lastName}`;

        await this.mailService.sendInvoiceData(
          fullname,
          company.name,
          company.user.email,
          paymentIntent.id,
        );
      }),
    );

    return { message: transactionMessages.statusChanged };
  }

  private async getTransactionByTId(transactionId: string) {
    const transaction = await this.transactionModel.findOne({ transactionId });

    if (!transaction) {
      throw new NotFoundException(transactionMessages.notFound);
    }

    return transaction;
  }
}
