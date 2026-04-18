import { Test, TestingModule } from '@nestjs/testing';
import { LoansDetailsController } from './loans_details.controller';
import { LoansDetailsModule } from './loans_details.module';
import { MongooseModule } from '@nestjs/mongoose';

describe('LoansDetailsController', () => {
  let controller: LoansDetailsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(
          process.env.MONGODB_URI || 'mongodb://localhost:27017/test',
        ),
        LoansDetailsModule,
      ],
    }).compile();

    controller = module.get<LoansDetailsController>(LoansDetailsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('LoansDetailsController methods', () => {
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
