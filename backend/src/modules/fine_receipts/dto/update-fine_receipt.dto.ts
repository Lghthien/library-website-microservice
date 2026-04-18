import { PartialType } from '@nestjs/mapped-types';
import { CreateFineReceiptDto } from './create-fine_receipt.dto';

export class UpdateFineReceiptDto extends PartialType(CreateFineReceiptDto) {}
