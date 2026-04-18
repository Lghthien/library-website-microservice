import {
  IsEmail,
  IsString,
  IsEnum,
  MinLength,
  IsOptional,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  phoneNumber?: string;

  @IsEnum(['ADMIN', 'LIBRARIAN'])
  role: string;

  @IsOptional()
  @IsEnum(['active', 'locked', 'pending'])
  status?: string;
}
