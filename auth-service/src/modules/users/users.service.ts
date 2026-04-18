import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './schema/user.schema';
import { MailService } from '../mail/mail.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private mailService: MailService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const { email, password } = createUserDto;

    // Kiểm tra email đã tồn tại
    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    // Hash mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    const createdUser = await this.userModel.create({
      ...createUserDto,
      password: hashedPassword,
      status: 'locked', // Luôn locked khi mới tạo
      isVerified: false,
      createdByAdmin: true,
    });

    // Gửi email xác thực
    await this.mailService.sendVerificationEmail({
      email: createdUser.email,
      name: createdUser.fullName,
    });

    return createdUser;
  }

  async findAll() {
    return this.userModel.find().select('-password').exec();
  }

  async findOne(id: string) {
    return this.userModel.findById(id).select('-password').exec();
  }

  async findByEmail(email: string) {
    return this.userModel.findOne({ email }).exec();
  }

  async updateAvatar(id: string, avatarUrl: string) {
    const user = await this.userModel
      .findByIdAndUpdate(id, { avatar: avatarUrl }, { new: true })
      .select('-password');

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    // Prevent activating unverified users
    if (updateUserDto.status === 'active') {
      const user = await this.userModel.findById(id).exec();
      if (!user) {
        throw new NotFoundException('User not found');
      }
      if (!user.isVerified) {
        throw new BadRequestException('Cannot activate unverified user');
      }
    }

    return this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .select('-password')
      .exec();
  }

  async lockUser(userId: string) {
    return this.userModel
      .findByIdAndUpdate(userId, { status: 'locked' }, { new: true })
      .select('-password')
      .exec();
  }

  async unlockUser(userId: string) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!user.isVerified) {
      throw new BadRequestException('Cannot activate unverified user');
    }

    return this.userModel
      .findByIdAndUpdate(userId, { status: 'active' }, { new: true })
      .select('-password')
      .exec();
  }

  async remove(id: string) {
    return this.userModel.findByIdAndDelete(id).exec();
  }

  async getUsersByRole(role: string) {
    return this.userModel.find({ role }).select('-password').exec();
  }
}
