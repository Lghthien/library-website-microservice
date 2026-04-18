import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Readers - BM1 (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let readerTypeId: string;
  let createdReaderId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    // Login to get token
    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'admin@library.com',
        password: 'admin123',
      });
    authToken = loginRes.body.access_token;

    // Get reader type
    const readerTypesRes = await request(app.getHttpServer())
      .get('/api/reader-types')
      .set('Authorization', `Bearer ${authToken}`);
    readerTypeId = readerTypesRes.body[0]._id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/readers', () => {
    it('should get all readers', () => {
      return request(app.getHttpServer())
        .get('/api/readers')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0]).toHaveProperty('fullName');
          expect(res.body[0]).toHaveProperty('code');
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer()).get('/api/readers').expect(401);
    });
  });

  describe('POST /api/readers - BM1: Lập thẻ độc giả', () => {
    it('should create new reader with valid data (QĐ1)', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 25); // 25 years old (18-55)

      return request(app.getHttpServer())
        .post('/api/readers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fullName: 'Nguyễn Văn Test',
          dateOfBirth: birthDate.toISOString(),
          address: '123 Test Street',
          email: `test${Date.now()}@email.com`,
          readerTypeId: readerTypeId,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('_id');
          expect(res.body).toHaveProperty('code');
          expect(res.body.code).toMatch(/^DG\d{4}$/);
          expect(res.body.fullName).toBe('Nguyễn Văn Test');
          expect(res.body).toHaveProperty('expiryDate');
          createdReaderId = res.body._id;
        });
    });

    it('should fail with age < 18 (QĐ1)', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 15); // 15 years old

      return request(app.getHttpServer())
        .post('/api/readers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fullName: 'Nguyễn Văn Trẻ',
          dateOfBirth: birthDate.toISOString(),
          address: '123 Test Street',
          email: `young${Date.now()}@email.com`,
          readerTypeId: readerTypeId,
        })
        .expect(400);
    });

    it('should fail with age > 55 (QĐ1)', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 60); // 60 years old

      return request(app.getHttpServer())
        .post('/api/readers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fullName: 'Nguyễn Văn Già',
          dateOfBirth: birthDate.toISOString(),
          address: '123 Test Street',
          email: `old${Date.now()}@email.com`,
          readerTypeId: readerTypeId,
        })
        .expect(400);
    });

    it('should fail with missing required fields', () => {
      return request(app.getHttpServer())
        .post('/api/readers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fullName: 'Test User',
        })
        .expect(400);
    });

    it('should fail with invalid email format', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 25);

      return request(app.getHttpServer())
        .post('/api/readers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fullName: 'Nguyễn Văn Test',
          dateOfBirth: birthDate.toISOString(),
          address: '123 Test Street',
          email: 'invalid-email',
          readerTypeId: readerTypeId,
        })
        .expect(400);
    });
  });

  describe('GET /api/readers/search', () => {
    it('should search readers by keyword', () => {
      return request(app.getHttpServer())
        .get('/api/readers/search?keyword=Nguyễn')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('GET /api/readers/expired', () => {
    it('should get expired readers', () => {
      return request(app.getHttpServer())
        .get('/api/readers/expired')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('GET /api/readers/with-debt', () => {
    it('should get readers with debt', () => {
      return request(app.getHttpServer())
        .get('/api/readers/with-debt')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('GET /api/readers/:id', () => {
    it('should get reader by ID', () => {
      return request(app.getHttpServer())
        .get(`/api/readers/${createdReaderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body._id).toBe(createdReaderId);
          expect(res.body).toHaveProperty('fullName');
        });
    });

    it('should return 404 for non-existent reader', () => {
      return request(app.getHttpServer())
        .get('/api/readers/000000000000000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PATCH /api/readers/:id', () => {
    it('should update reader information', () => {
      return request(app.getHttpServer())
        .patch(`/api/readers/${createdReaderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          address: '456 Updated Street',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.address).toBe('456 Updated Street');
        });
    });
  });

  describe('DELETE /api/readers/:id', () => {
    it('should delete reader', () => {
      return request(app.getHttpServer())
        .delete(`/api/readers/${createdReaderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });
});
