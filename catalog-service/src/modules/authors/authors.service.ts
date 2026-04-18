import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateAuthorDto } from './dto/create-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';
import { Author, AuthorDocument } from './schema/author.schema';

@Injectable()
export class AuthorsService {
  constructor(
    @InjectModel(Author.name) private authorModel: Model<AuthorDocument>,
  ) {}

  create(createAuthorDto: CreateAuthorDto) {
    const createdAuthor = new this.authorModel(createAuthorDto);
    return createdAuthor.save();
  }

  findAll() {
    return this.authorModel.find().exec();
  }

  findOne(id: string) {
    return this.authorModel.findById(id).exec();
  }

  update(id: string, updateAuthorDto: UpdateAuthorDto) {
    return this.authorModel
      .findByIdAndUpdate(id, updateAuthorDto, { new: true })
      .exec();
  }

  remove(id: string) {
    return this.authorModel.findByIdAndDelete(id).exec();
  }
}
