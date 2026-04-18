import { Test, TestingModule } from '@nestjs/testing';
import { LoansDetailsService } from './loans_details.service';
import { LoansDetailsModule } from './loans_details.module';
import { MongooseModule } from '@nestjs/mongoose';

describe('LoansDetailsService', () => {
  let service: LoansDetailsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(
          process.env.MONGODB_URI || 'mongodb://localhost:27017/test',
        ),
        LoansDetailsModule,
      ],
    }).compile();

    service = module.get<LoansDetailsService>(LoansDetailsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('LoansDetailsService methods', () => {
    it('should have create method', () => {
      expect(typeof service.create).toBe('function');
    });

    it('should have findAll method', () => {
      expect(typeof service.findAll).toBe('function');
    });

    it('should have findOne method', () => {
      expect(typeof service.findOne).toBe('function');
    });

    it('should have returnBook method', () => {
      expect(typeof service.returnBook).toBe('function');
    });
  });
});
