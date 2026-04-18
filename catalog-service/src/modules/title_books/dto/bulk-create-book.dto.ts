import { IsString, IsNumber, IsOptional } from 'class-validator';

export class BulkCreateBookDto {
  @IsString()
  title: string;

  @IsString()
  author: string;

  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  publisher?: string;

  @IsOptional()
  @IsNumber()
  publishYear?: number;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsNumber()
  quantity: number;
}
