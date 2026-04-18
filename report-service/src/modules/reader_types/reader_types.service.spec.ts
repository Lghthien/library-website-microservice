import { Test, TestingModule } from '@nestjs/testing';
import { ReaderTypesService } from './reader_types.service';
import { ReaderTypesModule } from './reader_types.module';
import { MongooseModule } from '@nestjs/mongoose';

describe('ReaderTypesService', () => {
  let service: ReaderTypesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(
          process.env.MONGODB_URI || 'mongodb://localhost:27017/test',
        ),
        ReaderTypesModule,
      ],
    }).compile();

    service = module.get<ReaderTypesService>(ReaderTypesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('ReaderTypesService methods', () => {
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
