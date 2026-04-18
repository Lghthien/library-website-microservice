import { Test, TestingModule } from '@nestjs/testing';
import { ReadersController } from './readers.controller';
import { ReadersModule } from './readers.module';
import { MongooseModule } from '@nestjs/mongoose';

describe('ReadersController', () => {
  let controller: ReadersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(
          process.env.MONGODB_URI || 'mongodb://localhost:27017/test',
        ),
        ReadersModule,
      ],
    }).compile();

    controller = module.get<ReadersController>(ReadersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('ReadersController methods', () => {
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
