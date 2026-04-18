import { PartialType } from '@nestjs/mapped-types';
import { CreateTitleBookDto } from './create-title_book.dto';

export class UpdateTitleBookDto extends PartialType(CreateTitleBookDto) {}
