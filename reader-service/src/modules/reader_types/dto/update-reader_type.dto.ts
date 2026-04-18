import { PartialType } from '@nestjs/mapped-types';
import { CreateReaderTypeDto } from './create-reader_type.dto';

export class UpdateReaderTypeDto extends PartialType(CreateReaderTypeDto) {}
