import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateReaderDto } from './dto/create-reader.dto';
import { UpdateReaderDto } from './dto/update-reader.dto';
import { BulkCreateReaderDto } from './dto/bulk-create-reader.dto';
import { Reader, ReaderDocument } from './schema/reader.schema';
import {
  ReaderType,
  ReaderTypeDocument,
} from '../reader_types/schema/reader-type.schema';
import {
  Parameter,
  ParameterDocument,
} from '../parameters/schema/parameter.schema';

@Injectable()
export class ReadersService {
  constructor(
    @InjectModel(Reader.name) private readerModel: Model<ReaderDocument>,
    @InjectModel(ReaderType.name)
    private readerTypeModel: Model<ReaderTypeDocument>,
    @InjectModel(Parameter.name)
    private parameterModel: Model<ParameterDocument>,
  ) {}

  async create(createReaderDto: CreateReaderDto) {
    const now = new Date();

    // 0. Kiểm tra trùng lặp độc giả (fullName, dateOfBirth, email, phoneNumber)
    const duplicateReader = await this.readerModel.findOne({
      fullName: createReaderDto.fullName,
      dateOfBirth: createReaderDto.dateOfBirth,
      email: createReaderDto.email,
      phoneNumber: createReaderDto.phoneNumber,
    });

    if (duplicateReader) {
      throw new BadRequestException(
        'Độc giả này đã tồn tại với cùng họ tên, ngày sinh, email và số điện thoại.',
      );
    }

    // 1. Kiểm tra Loại độc giả
    const readerType = await this.readerTypeModel.findById(
      createReaderDto.readerTypeId,
    );
    if (!readerType) {
      throw new BadRequestException('Mã loại độc giả không hợp lệ');
    }

    // 2. Logic Kiểm tra Độ tuổi (QĐ1: 18 - 55 tuổi)
    const minAgeParam = await this.parameterModel.findOne({
      paramName: 'QD1_MIN_AGE',
    });
    const maxAgeParam = await this.parameterModel.findOne({
      paramName: 'QD1_MAX_AGE',
    });

    const minAge = parseInt(minAgeParam?.paramValue || '18');
    const maxAge = parseInt(maxAgeParam?.paramValue || '55');

    const birthDate = new Date(createReaderDto.dateOfBirth);
    let age = now.getFullYear() - birthDate.getFullYear();
    const monthDiff = now.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && now.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    if (age < minAge || age > maxAge) {
      throw new BadRequestException(
        `Tuổi độc giả phải từ ${minAge} đến ${maxAge} tuổi (Hiện tại: ${age} tuổi)`,
      );
    }

    // 3. Tính ngày hết hạn thẻ (Theo loại độc giả)
    const cardValidityMonths = readerType.cardValidityMonths || 6;

    const expiryDate = new Date(now);
    expiryDate.setMonth(expiryDate.getMonth() + cardValidityMonths);

    const readerData = {
      fullName: createReaderDto.fullName,
      dateOfBirth: createReaderDto.dateOfBirth,
      address: createReaderDto.address,
      email: createReaderDto.email,
      phoneNumber: createReaderDto.phoneNumber,
      readerTypeId: new Types.ObjectId(createReaderDto.readerTypeId),
      createdDate: now,
      expiryDate: expiryDate,
      totalDebt: 0,
    };

    const createdReader = new this.readerModel(readerData);
    return createdReader.save().then((doc) => doc.populate('readerTypeId'));
  }

  async bulkCreate(bulkData: BulkCreateReaderDto[]) {
    const results = [];

    // Pre-fetch params for efficiency (optimistic) or fetch inside loop?
    // Inside loop is safer if params change, but slower. Outside is fine for batch.

    const minAgeParam = await this.parameterModel.findOne({
      paramName: 'QD1_MIN_AGE',
    });
    const maxAgeParam = await this.parameterModel.findOne({
      paramName: 'QD1_MAX_AGE',
    });
    const minAge = parseInt(minAgeParam?.paramValue || '18');
    const maxAge = parseInt(maxAgeParam?.paramValue || '55');
    const now = new Date();

    for (const item of bulkData) {
      try {
        // Check if exists (check all identifying fields)
        const existing = await this.readerModel.findOne({
          fullName: item.fullName,
          dateOfBirth: item.dateOfBirth,
          email: item.email,
          phoneNumber: item.phoneNumber,
        });
        if (existing) {
          results.push({
            fullName: item.fullName,
            status: 'error',
            message:
              'Độc giả này đã tồn tại với cùng họ tên, ngày sinh, email và số điện thoại.',
          });
          continue;
        }

        // Find Reader Type
        let readerType = await this.readerTypeModel.findOne({
          typeName: { $regex: new RegExp(`^${item.readerType}$`, 'i') },
        });

        if (!readerType) {
          // Fallback: If type not found, use the first available type (e.g., "Loại X")
          readerType = await this.readerTypeModel.findOne();
          if (!readerType) {
            results.push({
              email: item.email,
              status: 'error',
              message: `Reader Type '${item.readerType}' not found and no default available`,
            });
            continue;
          }
        }

        // Age Check
        const birthDate = new Date(item.dateOfBirth);
        let age = now.getFullYear() - birthDate.getFullYear();
        if (
          now.getMonth() < birthDate.getMonth() ||
          (now.getMonth() === birthDate.getMonth() &&
            now.getDate() < birthDate.getDate())
        ) {
          age--;
        }

        if (age < minAge || age > maxAge) {
          results.push({
            email: item.email,
            status: 'error',
            message: `Invalid Age: ${age}`,
          });
          continue;
        }

        // Calculate Expiry
        const cardValidityMonths = readerType.cardValidityMonths || 6;
        const expiryDate = new Date(now);
        expiryDate.setMonth(expiryDate.getMonth() + cardValidityMonths);

        // Create
        await this.readerModel.create({
          fullName: item.fullName,
          dateOfBirth: item.dateOfBirth,
          address: item.address,
          email: item.email,
          phoneNumber: item.phoneNumber,
          readerTypeId: readerType._id,
          createdDate: now,
          expiryDate: expiryDate,
          totalDebt: 0,
        });

        results.push({ email: item.email, status: 'success' });
      } catch (err) {
        results.push({
          email: item.email,
          status: 'error',
          message: err.message,
        });
      }
    }
    return results;
  }

  async findAll() {
    return this.readerModel
      .find({ isDeleted: { $ne: true } })
      .populate('readerTypeId')
      .exec();
  }

  async findOne(id: string) {
    return this.readerModel.findById(id).populate('readerTypeId').exec();
  }

  async findByEmail(email: string) {
    return this.readerModel.findOne({ email }).populate('readerTypeId').exec();
  }

  async searchByNameOrEmail(keyword: string) {
    const conditions: any[] = [
      { fullName: { $regex: keyword, $options: 'i' } },
      { email: { $regex: keyword, $options: 'i' } },
      { address: { $regex: keyword, $options: 'i' } },
      { code: { $regex: keyword, $options: 'i' } },
    ];

    if (Types.ObjectId.isValid(keyword)) {
      conditions.push({ _id: keyword });
    }

    return this.readerModel
      .find({ $or: conditions })
      .populate('readerTypeId')
      .exec();
  }

  async findActiveReaders() {
    return this.readerModel
      .find({ expiryDate: { $gte: new Date() } })
      .populate('readerTypeId')
      .exec();
  }

  async findExpiredCards() {
    return this.readerModel
      .find({ expiryDate: { $lt: new Date() } })
      .populate('readerTypeId')
      .exec();
  }

  async findReadersWithDebt() {
    return this.readerModel
      .find({ totalDebt: { $gt: 0 } })
      .populate('readerTypeId')
      .sort({ totalDebt: -1 })
      .exec();
  }

  async advancedSearch(filters: {
    status?: string;
    hasDebt?: boolean;
    readerTypeId?: string;
    minDebt?: number;
    maxDebt?: number;
  }) {
    const query: any = {};
    const now = new Date();

    // Status filter: active or expired
    if (filters.status === 'active') {
      query.expiryDate = { $gte: now };
    } else if (filters.status === 'expired') {
      query.expiryDate = { $lt: now };
    }

    // Debt filter
    if (filters.hasDebt === true) {
      query.totalDebt = { $gt: 0 };
    } else if (filters.hasDebt === false) {
      query.totalDebt = 0;
    }

    // Debt amount range
    if (filters.minDebt !== undefined || filters.maxDebt !== undefined) {
      query.totalDebt = {};
      if (filters.minDebt !== undefined) query.totalDebt.$gte = filters.minDebt;
      if (filters.maxDebt !== undefined) query.totalDebt.$lte = filters.maxDebt;
    }

    // Reader type filter
    if (filters.readerTypeId) {
      query.readerTypeId = filters.readerTypeId;
    }

    return this.readerModel
      .find(query)
      .populate('readerTypeId')
      .sort({ totalDebt: -1 })
      .exec();
  }

  async update(id: string, updateReaderDto: UpdateReaderDto) {
    const updates: any = { ...updateReaderDto };

    // If readerTypeId is updated, we might want to recalculate expiry date,
    // BUT usually updating info shouldn't reset the card expiry unless explicitly requested.
    // The previous logic reset expiry date on ANY update if readerTypeId was present, which might be wrong.
    // Let's only update expiry if it's a new card issuance logic, but for simple update, we should keep expiry.
    // However, if the user changes ReaderType, maybe the policy changes?
    // For now, let's keep the logic but ensure we don't break existing dates if not intended.

    // Actually, the issue "chưa thay đổi được thông tin độc giả" might be due to strict validation or missing fields.
    // The frontend sends `dateOfBirth` as string, DTO expects Date.
    // Mongoose handles string-to-date, but let's ensure `updates` object is clean.

    if (updateReaderDto.readerTypeId) {
      // Logic to update expiry date if type changes - keeping it for now as per original code
      // but ensuring we don't crash if readerType is not found
      const readerType = await this.readerTypeModel.findById(
        updateReaderDto.readerTypeId,
      );
      if (readerType) {
        // If we want to reset expiry on type change:
        // const cardValidityMonths = readerType.cardValidityMonths || 6;
        // const now = new Date();
        // updates.expiryDate = new Date(now.getTime() + cardValidityMonths * 30 * 24 * 60 * 60 * 1000);
      }
    }

    return this.readerModel
      .findByIdAndUpdate(id, updates, { new: true })
      .populate('readerTypeId')
      .exec();
  }

  async renewCard(readerId: string, monthsOfValidity?: number) {
    // 1. Get current reader data to check existing expiry date
    const reader = await this.readerModel.findById(readerId);
    if (!reader) {
      throw new BadRequestException('Độc giả không tồn tại');
    }

    // 2. Get validity months from ReaderType if not provided
    if (!monthsOfValidity) {
      // Need to fetch full readerType to get validity months
      // Assuming reader.readerTypeId could be an ID or populated object depending on how it was loaded.
      // But findById usually returns reader with ID ref unless .populate() is used.
      // Standard way: fetch ReaderType manually.

      let typeId: string;
      if (
        reader.readerTypeId &&
        typeof reader.readerTypeId === 'object' &&
        '_id' in reader.readerTypeId
      ) {
        typeId = (reader.readerTypeId as any)._id; // Safe cast if it's populated
      } else {
        typeId = reader.readerTypeId as any;
      }

      const readerType = await this.readerTypeModel.findById(typeId);
      monthsOfValidity = readerType?.cardValidityMonths || 6;
    }

    const now = new Date();
    const currentExpiry = new Date(reader.expiryDate);
    let newExpiryDate: Date;

    // 3. Calculate new expiry date
    if (currentExpiry < now) {
      // Nếu đã hết hạn: Tính từ thời điểm hiện tại
      newExpiryDate = new Date(now);
      newExpiryDate.setMonth(newExpiryDate.getMonth() + monthsOfValidity);
    } else {
      // Nếu còn hạn: Cộng nối tiếp vào hạn cũ
      newExpiryDate = new Date(currentExpiry);
      newExpiryDate.setMonth(newExpiryDate.getMonth() + monthsOfValidity);
    }

    return this.readerModel
      .findByIdAndUpdate(readerId, { expiryDate: newExpiryDate }, { new: true })
      .populate('readerTypeId')
      .exec();
  }

  async updateDebt(readerId: string, debtAmount: number) {
    const reader = await this.readerModel.findById(readerId);
    if (!reader) {
      throw new BadRequestException('Reader not found');
    }

    const updatedTotalDebt = reader.totalDebt + debtAmount;
    return this.readerModel
      .findByIdAndUpdate(
        readerId,
        { totalDebt: updatedTotalDebt },
        { new: true },
      )
      .populate('readerTypeId')
      .exec();
  }

  async remove(id: string) {
    const reader = await this.readerModel.findById(id).exec();
    if (!reader) {
      return null;
    }

    // Soft delete: mark as deleted instead of removing from database
    reader.isDeleted = true;
    reader.deletedAt = new Date();
    await reader.save();

    return reader;
  }
}
