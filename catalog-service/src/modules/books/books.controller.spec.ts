import { Test, TestingModule } from '@nestjs/testing';
import { BooksController } from './books.controller';
import { BooksModule } from './books.module';
import { MongooseModule } from '@nestjs/mongoose';

describe('BooksController', () => {
  let controller: BooksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(
          process.env.MONGODB_URI || 'mongodb://localhost:27017/test',
        ),
        BooksModule,
      ],
    }).compile();

    controller = module.get<BooksController>(BooksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('BooksController methods', () => {
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

    it('should have search method', () => {
      expect(typeof controller.search).toBe('function');
    });

    it('should have advancedSearch method', () => {
      expect(typeof controller.advancedSearch).toBe('function');
    });
  });
});
