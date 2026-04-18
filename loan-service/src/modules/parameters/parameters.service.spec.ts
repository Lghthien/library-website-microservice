import { Test, TestingModule } from '@nestjs/testing';
import { ParametersService } from './parameters.service';
import { ParametersModule } from './parameters.module';
import { MongooseModule } from '@nestjs/mongoose';

describe('ParametersService', () => {
  let service: ParametersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(
          process.env.MONGODB_URI || 'mongodb://localhost:27017/test',
        ),
        ParametersModule,
      ],
    }).compile();

    service = module.get<ParametersService>(ParametersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('ParametersService methods', () => {
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
  });
});
