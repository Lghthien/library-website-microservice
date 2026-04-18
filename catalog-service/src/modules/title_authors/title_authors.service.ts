import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateTitleAuthorDto } from './dto/create-title_author.dto';
import { UpdateTitleAuthorDto } from './dto/update-title_author.dto';
import { TitleAuthor, TitleAuthorDocument } from './schema/title-author.schema';

@Injectable()
export class TitleAuthorsService {
  constructor(
    @InjectModel(TitleAuthor.name)
    private titleAuthorModel: Model<TitleAuthorDocument>,
  ) {}

  create(createTitleAuthorDto: CreateTitleAuthorDto) {
    const createdTitleAuthor = new this.titleAuthorModel({
      titleId: new Types.ObjectId(createTitleAuthorDto.titleId),
      authorId: new Types.ObjectId(createTitleAuthorDto.authorId),
    });
    return createdTitleAuthor.save();
  }

  findAll() {
    return this.titleAuthorModel
      .find()
      .populate('titleId')
      .populate('authorId')
      .exec();
  }

  findOne(id: string) {
    return this.titleAuthorModel
      .findById(id)
      .populate('titleId')
      .populate('authorId')
      .exec();
  }

  update(id: string, updateTitleAuthorDto: UpdateTitleAuthorDto) {
    return this.titleAuthorModel
      .findByIdAndUpdate(id, updateTitleAuthorDto, { new: true })
      .populate('titleId')
      .populate('authorId')
      .exec();
  }

  remove(id: string) {
    return this.titleAuthorModel.findByIdAndDelete(id).exec();
  }
}
