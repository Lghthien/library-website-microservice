import { Test, TestingModule } from '@nestjs/testing';
import { BookCopiesController } from './book_copies.controller';
import { BookCopiesModule } from './book_copies.module';
import { MongooseModule } from '@nestjs/mongoose';

describe('BookCopiesController', () => {
  let controller: BookCopiesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(
          process.env.MONGODB_URI || 'mongodb://localhost:27017/test',
        ),
        BookCopiesModule,
      ],
    }).compile();

    controller = module.get<BookCopiesController>(BookCopiesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('BookCopiesController methods', () => {
    it('should have create method', () => {
      expect(typeof controller.create).toBe('function');
    });

    it('should have findAll method', () => {
      expect(typeof controller.findAll).toBe('function');
    });

    it('should have findOne method', () => {
      expect(typeof controller.findOne).toBe('function');
    });

    it('should have update method', () => {
      expect(typeof controller.update).toBe('function');
    });

    it('should have remove method', () => {
      expect(typeof controller.remove).toBe('function');
    });
  });
});
