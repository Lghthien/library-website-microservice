import { Test, TestingModule } from '@nestjs/testing';
import { FineReceiptsService } from './fine_receipts.service';
import { FineReceiptsModule } from './fine_receipts.module';
import { MongooseModule } from '@nestjs/mongoose';

describe('FineReceiptsService', () => {
  let service: FineReceiptsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(
          process.env.MONGODB_URI || 'mongodb://localhost:27017/test',
        ),
        FineReceiptsModule,
      ],
    }).compile();

    service = module.get<FineReceiptsService>(FineReceiptsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('FineReceiptsService methods', () => {
    it('should have create method', () => {
      expect(typeof service.create).toBe('function');
    });

    it('should have findAll method', () => {
      expect(typeof service.findAll).toBe('function');
    });

    it('should have findOne method', () => {
      expect(typeof service.findOne).toBe('function');
    });

    it('should have update method', () => {
      expect(typeof service.update).toBe('function');
    });

    it('should have remove method', () => {
      expect(typeof service.remove).toBe('function');
    });
  });
});
