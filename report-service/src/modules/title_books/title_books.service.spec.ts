import { Test, TestingModule } from '@nestjs/testing';
import { TitleBooksService } from './title_books.service';
import { TitleBooksModule } from './title_books.module';
import { MongooseModule } from '@nestjs/mongoose';

describe('TitleBooksService', () => {
  let service: TitleBooksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(
          process.env.MONGODB_URI || 'mongodb://localhost:27017/test',
        ),
        TitleBooksModule,
      ],
    }).compile();

    service = module.get<TitleBooksService>(TitleBooksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('TitleBooksService methods', () => {
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
