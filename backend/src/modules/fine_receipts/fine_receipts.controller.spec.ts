import { Test, TestingModule } from '@nestjs/testing';
import { FineReceiptsController } from './fine_receipts.controller';
import { FineReceiptsModule } from './fine_receipts.module';
import { MongooseModule } from '@nestjs/mongoose';

describe('FineReceiptsController', () => {
  let controller: FineReceiptsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(
          process.env.MONGODB_URI || 'mongodb://localhost:27017/test',
        ),
        FineReceiptsModule,
      ],
    }).compile();

    controller = module.get<FineReceiptsController>(FineReceiptsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('FineReceiptsController methods', () => {
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
