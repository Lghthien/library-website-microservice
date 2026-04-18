import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { FineReceiptsService } from './fine_receipts.service';
import { FineReceiptsController } from './fine_receipts.controller';
import { FineReceipt, FineReceiptSchema } from './schema/fine-receipt.schema';
import { ReadersModule } from '../readers/readers.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FineReceipt.name, schema: FineReceiptSchema },
    ]),
    AuthModule,
    ReadersModule,
  ],
  controllers: [FineReceiptsController],
  providers: [FineReceiptsService],
  exports: [MongooseModule],
})
export class FineReceiptsModule {}
