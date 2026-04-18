import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { MailService } from './mail.service';
import { MailLog } from './schema/mail-log.schema';
import { User } from '../users/schema/user.schema';

describe('MailService', () => {
  let service: MailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: getModelToken(MailLog.name),
          useValue: {
            create: jest.fn(),
          },
        },
        {
          provide: getModelToken(User.name),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('MailService methods', () => {
    it('should have sendVerificationEmail method', () => {
      expect(typeof service.sendVerificationEmail).toBe('function');
    });
  });
});
