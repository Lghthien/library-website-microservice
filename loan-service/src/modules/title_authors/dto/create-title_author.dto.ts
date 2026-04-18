import { IsNotEmpty, IsMongoId } from 'class-validator';

export class CreateTitleAuthorDto {
  @IsNotEmpty()
  @IsMongoId()
  titleId: string;

  @IsNotEmpty()
  @IsMongoId()
  authorId: string;
}
