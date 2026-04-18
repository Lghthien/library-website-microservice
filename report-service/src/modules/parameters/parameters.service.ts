import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateParameterDto } from './dto/create-parameter.dto';
import { UpdateParameterDto } from './dto/update-parameter.dto';
import { Parameter, ParameterDocument } from './schema/parameter.schema';
import { AuditLogsService } from '../audit_logs/audit-logs.service';

@Injectable()
export class ParametersService {
  constructor(
    @InjectModel(Parameter.name)
    private parameterModel: Model<ParameterDocument>,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async create(createParameterDto: CreateParameterDto) {
    const createdParameter = new this.parameterModel(createParameterDto);
    return createdParameter.save();
  }

  async findAll() {
    return this.parameterModel.find().exec();
  }

  async findOne(id: string) {
    return this.parameterModel.findById(id).exec();
  }

  async findByName(paramName: string) {
    return this.parameterModel.findOne({ paramName }).exec();
  }

  async update(id: string, updateParameterDto: UpdateParameterDto) {
    return this.parameterModel
      .findByIdAndUpdate(id, updateParameterDto, { new: true })
      .exec();
  }

  async updateByName(paramName: string, paramValue: string, userId?: string) {
    // Fetch old value for audit log
    const oldParam = await this.parameterModel.findOne({ paramName }).exec();

    // Perform update
    const updatedParam = await this.parameterModel
      .findOneAndUpdate({ paramName }, { paramValue }, { new: true })
      .exec();

    // Create audit log if userId is provided
    if (updatedParam && userId) {
      await this.auditLogsService.create(
        userId,
        'UPDATE',
        'parameters',
        updatedParam._id.toString(),
        'QĐ8: Thay đổi quy định',
        { paramName, paramValue: oldParam?.paramValue || '' },
        { paramName, paramValue: updatedParam.paramValue },
      );
    }

    return updatedParam;
  }

  async getParameterValue(paramName: string): Promise<string | null> {
    const param = await this.parameterModel.findOne({ paramName }).exec();
    return param ? param.paramValue : null;
  }

  async getParameterAsNumber(paramName: string): Promise<number | null> {
    const value = await this.getParameterValue(paramName);
    return value ? parseInt(value, 10) : null;
  }

  async remove(id: string) {
    return this.parameterModel.findByIdAndDelete(id).exec();
  }
}
