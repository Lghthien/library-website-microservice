import { Test, TestingModule } from '@nestjs/testing';
import { ReaderTypesController } from './reader_types.controller';
import { ReaderTypesModule } from './reader_types.module';
import { MongooseModule } from '@nestjs/mongoose';

describe('ReaderTypesController', () => {
  let controller: ReaderTypesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(
          process.env.MONGODB_URI || 'mongodb://localhost:27017/test',
        ),
        ReaderTypesModule,
      ],
    }).compile();

    controller = module.get<ReaderTypesController>(ReaderTypesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('ReaderTypesController methods', () => {
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
