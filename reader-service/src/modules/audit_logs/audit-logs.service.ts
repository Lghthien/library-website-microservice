import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuditLog, AuditLogDocument } from './schema/audit-log.schema';

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>,
  ) {}

  // Create audit log entry
  async create(
    userId: string,
    action: string,
    tableName: string,
    recordId?: string,
    description?: string,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>,
  ) {
    const auditLog = new this.auditLogModel({
      userId: new Types.ObjectId(userId),
      action,
      tableName,
      recordId,
      description,
      oldValues,
      newValues,
      timestamp: new Date(),
    });
    return await auditLog.save();
  }

  // Get all audit logs (paginated)
  async getAllLogs(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const total = await this.auditLogModel.countDocuments();
    const logs = await this.auditLogModel
      .find()
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'fullName email')
      .exec();

    return {
      data: logs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Get logs by user
  async getLogsByUser(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const total = await this.auditLogModel.countDocuments({
      userId: userId as any,
    });
    const logs = await this.auditLogModel
      .find({ userId: userId as any })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'fullName email')
      .exec();

    return {
      data: logs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Get logs by table
  async getLogsByTable(
    tableName: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const skip = (page - 1) * limit;
    const total = await this.auditLogModel.countDocuments({ tableName });
    const logs = await this.auditLogModel
      .find({ tableName })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'fullName email')
      .exec();

    return {
      data: logs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Get logs by action type
  async getLogsByAction(action: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const total = await this.auditLogModel.countDocuments({ action });
    const logs = await this.auditLogModel
      .find({ action })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'fullName email')
      .exec();

    return {
      data: logs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Get logs by date range
  async getLogsByDateRange(
    startDate: Date,
    endDate: Date,
    page: number = 1,
    limit: number = 20,
  ) {
    const skip = (page - 1) * limit;
    const total = await this.auditLogModel.countDocuments({
      timestamp: { $gte: startDate, $lte: endDate },
    });
    const logs = await this.auditLogModel
      .find({ timestamp: { $gte: startDate, $lte: endDate } })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'fullName email')
      .exec();

    return {
      data: logs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Get audit log statistics
  async getStatistics(startDate?: Date, endDate?: Date) {
    const matchStage: any = {};

    if (startDate || endDate) {
      matchStage.timestamp = {};
      if (startDate) matchStage.timestamp.$gte = startDate;
      if (endDate) matchStage.timestamp.$lte = endDate;
    }

    const stats = await this.auditLogModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const tableStats = await this.auditLogModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$tableName',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    return {
      actionStats: stats,
      tableStats: tableStats,
    };
  }

  // Get recent activity
  async getRecentActivity(limit: number = 10) {
    return await this.auditLogModel
      .find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('userId', 'fullName email')
      .exec();
  }
}
