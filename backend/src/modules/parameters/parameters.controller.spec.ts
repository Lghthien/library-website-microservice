import { Test, TestingModule } from '@nestjs/testing';
import { ParametersController } from './parameters.controller';
import { ParametersModule } from './parameters.module';
import { MongooseModule } from '@nestjs/mongoose';

describe('ParametersController', () => {
  let controller: ParametersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(
          process.env.MONGODB_URI || 'mongodb://localhost:27017/test',
        ),
        ParametersModule,
      ],
    }).compile();

    controller = module.get<ParametersController>(ParametersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('ParametersController methods', () => {
    it('should have findAll method', () => {
      expect(typeof controller.findAll).toBe('function');
    });

    it('should have findOne method', () => {
      expect(typeof controller.findOne).toBe('function');
    });

    it('should have update method', () => {
      expect(typeof controller.update).toBe('function');
    });
  });
});
