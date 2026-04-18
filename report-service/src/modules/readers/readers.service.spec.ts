import { Test, TestingModule } from '@nestjs/testing';
import { ReadersService } from './readers.service';
import { ReadersModule } from './readers.module';
import { MongooseModule } from '@nestjs/mongoose';

describe('ReadersService', () => {
  let service: ReadersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(
          process.env.MONGODB_URI || 'mongodb://localhost:27017/test',
        ),
        ReadersModule,
      ],
    }).compile();

    service = module.get<ReadersService>(ReadersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('ReadersService methods', () => {
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
