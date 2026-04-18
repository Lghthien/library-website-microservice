import { PartialType } from '@nestjs/mapped-types';
import { CreateTitleAuthorDto } from './create-title_author.dto';

export class UpdateTitleAuthorDto extends PartialType(CreateTitleAuthorDto) {}
