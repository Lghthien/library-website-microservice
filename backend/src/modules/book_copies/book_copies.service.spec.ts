import { Test, TestingModule } from '@nestjs/testing';
import { BookCopiesService } from './book_copies.service';
import { BookCopiesModule } from './book_copies.module';
import { MongooseModule } from '@nestjs/mongoose';

describe('BookCopiesService', () => {
  let service: BookCopiesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(
          process.env.MONGODB_URI || 'mongodb://localhost:27017/test',
        ),
        BookCopiesModule,
      ],
    }).compile();

    service = module.get<BookCopiesService>(BookCopiesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('BookCopiesService methods', () => {
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
