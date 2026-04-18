import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateReaderTypeDto } from './dto/create-reader_type.dto';
import { UpdateReaderTypeDto } from './dto/update-reader_type.dto';
import { ReaderType, ReaderTypeDocument } from './schema/reader-type.schema';

@Injectable()
export class ReaderTypesService {
  constructor(
    @InjectModel(ReaderType.name)
    private readerTypeModel: Model<ReaderTypeDocument>,
  ) {}

  create(createReaderTypeDto: CreateReaderTypeDto) {
    const createdReaderType = new this.readerTypeModel(createReaderTypeDto);
    return createdReaderType.save();
  }

  findAll() {
    return this.readerTypeModel.find().exec();
  }

  findOne(id: string) {
    return this.readerTypeModel.findById(id).exec();
  }

  update(id: string, updateReaderTypeDto: UpdateReaderTypeDto) {
    return this.readerTypeModel
      .findByIdAndUpdate(id, updateReaderTypeDto, { new: true })
      .exec();
  }

  remove(id: string) {
    return this.readerTypeModel.findByIdAndDelete(id).exec();
  }
}
