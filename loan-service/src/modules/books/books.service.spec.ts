import { Test, TestingModule } from '@nestjs/testing';
import { BooksService } from './books.service';
import { BooksModule } from './books.module';
import { MongooseModule } from '@nestjs/mongoose';

describe('BooksService', () => {
  let service: BooksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(
          process.env.MONGODB_URI || 'mongodb://localhost:27017/test',
        ),
        BooksModule,
      ],
    }).compile();

    service = module.get<BooksService>(BooksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('BooksService methods', () => {
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

    it('should have search method', () => {
      expect(typeof service.search).toBe('function');
    });

    it('should have advancedSearch method', () => {
      expect(typeof service.advancedSearch).toBe('function');
    });
  });
});
