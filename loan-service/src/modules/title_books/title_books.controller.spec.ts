import { Test, TestingModule } from '@nestjs/testing';
import { TitleBooksController } from './title_books.controller';
import { TitleBooksModule } from './title_books.module';
import { MongooseModule } from '@nestjs/mongoose';

describe('TitleBooksController', () => {
  let controller: TitleBooksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(
          process.env.MONGODB_URI || 'mongodb://localhost:27017/test',
        ),
        TitleBooksModule,
      ],
    }).compile();

    controller = module.get<TitleBooksController>(TitleBooksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('TitleBooksController methods', () => {
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
