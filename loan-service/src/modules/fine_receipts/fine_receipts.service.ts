import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateFineReceiptDto } from './dto/create-fine_receipt.dto';
import { UpdateFineReceiptDto } from './dto/update-fine_receipt.dto';
import { FineReceipt, FineReceiptDocument } from './schema/fine-receipt.schema';
import { Reader, ReaderDocument } from '../readers/schema/reader.schema';

Injectable();
export class FineReceiptsService {
  constructor(
    @InjectModel(FineReceipt.name)
    private fineReceiptModel: Model<FineReceiptDocument>,
    @InjectModel(Reader.name) private readerModel: Model<ReaderDocument>,
  ) {}

  async create(createFineReceiptDto: CreateFineReceiptDto) {
    // 1. Kiểm tra sự tồn tại của Độc giả
    const reader = await this.readerModel.findById(
      createFineReceiptDto.readerId,
    );
    if (!reader) throw new NotFoundException('Không tìm thấy độc giả');

    // 2. Kiểm tra Quy định 6: Số tiền thu không vượt quá tiền nợ
    if (createFineReceiptDto.amountPaid > reader.totalDebt) {
      throw new BadRequestException(
        `Số tiền thu (${createFineReceiptDto.amountPaid}) không được vượt quá số nợ hiện tại (${reader.totalDebt})`,
      );
    }

    // 3. Tạo phiếu thu mới
    const createdFineReceipt = new this.fineReceiptModel({
      ...createFineReceiptDto,
      readerId: new Types.ObjectId(createFineReceiptDto.readerId), // Convert string to ObjectId
      paymentDate: new Date(),
      status: 'paid', // Mặc định là đã thu khi tạo phiếu
    });

    await createdFineReceipt.save();

    // 4. Cập nhật nợ của Độc giả (Giảm nợ)
    await this.readerModel.findByIdAndUpdate(createFineReceiptDto.readerId, {
      $inc: { totalDebt: -createFineReceiptDto.amountPaid },
    });

    return createdFineReceipt;
  }

  async findAll() {
    return await this.fineReceiptModel
      .find()
      .populate('readerId')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string) {
    return await this.fineReceiptModel.findById(id).populate('readerId').exec();
  }

  async findByReader(readerId: string) {
    // Convert readerId string to ObjectId
    return await this.fineReceiptModel
      .find({ readerId: new Types.ObjectId(readerId) })
      .populate('readerId')
      .exec();
  }

  async findUnpaid() {
    return await this.fineReceiptModel
      .find({ status: 'unpaid' })
      .populate('readerId')
      .exec();
  }

  async search(keyword?: string, startDate?: Date, endDate?: Date) {
    const pipeline: any[] = [];

    // 1. Lookup Reader info
    pipeline.push({
      $lookup: {
        from: 'readers',
        localField: 'readerId',
        foreignField: '_id',
        as: 'reader',
      },
    });

    pipeline.push({ $unwind: '$reader' });

    // 2. Match Date Range
    if (startDate || endDate) {
      const dateMatch: any = {};
      if (startDate) dateMatch.$gte = new Date(startDate);
      if (endDate) dateMatch.$lte = new Date(endDate);
      pipeline.push({ $match: { paymentDate: dateMatch } });
    }

    // 3. Match Keyword
    if (keyword) {
      const amount = Number(keyword);
      const isAmount = !isNaN(amount);

      pipeline.push({
        $addFields: {
          receiptIdStr: { $toString: '$_id' },
        },
      });

      const orConditions: any[] = [
        { 'reader.fullName': { $regex: keyword, $options: 'i' } },
        { 'reader.email': { $regex: keyword, $options: 'i' } },
        { 'reader.address': { $regex: keyword, $options: 'i' } },
        { receiptIdStr: { $regex: keyword, $options: 'i' } },
      ];

      if (isAmount) {
        orConditions.push({ amountPaid: amount });
      }

      pipeline.push({ $match: { $or: orConditions } });
    }

    // 4. Sort
    pipeline.push({ $sort: { paymentDate: -1 } });

    // 5. Project to match populate structure
    pipeline.push({
      $addFields: {
        readerId: '$reader',
      },
    });

    pipeline.push({
      $project: {
        reader: 0,
        receiptIdStr: 0,
        readerIdConverted: 0, // Remove temporary field
      },
    });

    return await this.fineReceiptModel.aggregate(pipeline).exec();
  }

  async update(id: string, updateFineReceiptDto: UpdateFineReceiptDto) {
    const currentReceipt = await this.fineReceiptModel.findById(id);
    if (!currentReceipt)
      throw new NotFoundException('Không tìm thấy phiếu thu');

    const reader = await this.readerModel.findById(currentReceipt.readerId);
    if (!reader)
      throw new NotFoundException('Không tìm thấy độc giả liên quan');

    // Xử lý logic Quy định 6 khi cập nhật số tiền thu
    if (updateFineReceiptDto.amountPaid !== undefined) {
      // Tính toán nợ thực tế TRƯỚC khi có phiếu thu này
      const debtBeforeThisReceipt =
        reader.totalDebt + currentReceipt.amountPaid;

      // Kiểm tra: Số tiền mới định thu có vượt quá số nợ gốc ban đầu không
      if (updateFineReceiptDto.amountPaid > debtBeforeThisReceipt) {
        throw new BadRequestException(
          `Cập nhật thất bại: Số tiền mới (${updateFineReceiptDto.amountPaid}) vượt quá nợ gốc (${debtBeforeThisReceipt})`,
        );
      }

      // Tính độ chênh lệch để cập nhật totalDebt của Reader
      const diff = updateFineReceiptDto.amountPaid - currentReceipt.amountPaid;
      await this.readerModel.findByIdAndUpdate(reader._id, {
        $inc: { totalDebt: -diff },
      });
    }

    return await this.fineReceiptModel
      .findByIdAndUpdate(id, updateFineReceiptDto, { new: true })
      .populate('readerId')
      .exec();
  }

  async markAsPaid(
    id: string,
    paymentDate: Date = new Date(),
    notes: string = '',
  ) {
    return await this.fineReceiptModel
      .findByIdAndUpdate(
        id,
        { status: 'paid', paymentDate, notes },
        { new: true },
      )
      .populate('readerId')
      .exec();
  }

  async remove(id: string) {
    return await this.fineReceiptModel.findByIdAndDelete(id).exec();
  }
}
