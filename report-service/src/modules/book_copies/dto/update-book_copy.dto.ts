import { PartialType } from '@nestjs/mapped-types';
import { CreateBookCopyDto } from './create-book_copy.dto';

export class UpdateBookCopyDto extends PartialType(CreateBookCopyDto) {}
