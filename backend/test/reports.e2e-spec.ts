import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Reports - BM7 (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    // Login
    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'admin@library.com',
        password: 'admin123',
      });
    authToken = loginRes.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/reports/dashboard', () => {
    it('should get dashboard statistics', () => {
      return request(app.getHttpServer())
        .get('/api/reports/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('readers');
          expect(res.body).toHaveProperty('books');
          expect(res.body).toHaveProperty('loans');
          expect(res.body).toHaveProperty('fines');
          expect(res.body.readers).toHaveProperty('total');
          expect(res.body.books).toHaveProperty('total');
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get('/api/reports/dashboard')
        .expect(401);
    });
  });

  describe('GET /api/reports/borrow-by-category - BM7.1: Thống kê mượn theo thể loại', () => {
    it('should get borrow statistics by category', () => {
      return request(app.getHttpServer())
        .get('/api/reports/borrow-by-category')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          if (res.body.length > 0) {
            expect(res.body[0]).toHaveProperty('categoryName');
            expect(res.body[0]).toHaveProperty('borrowCount');
            expect(res.body[0]).toHaveProperty('percentage');
          }
        });
    });

    it('should filter by date range', () => {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
      const endDate = new Date();

      return request(app.getHttpServer())
        .get(
          `/api/reports/borrow-by-category?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        )
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('GET /api/reports/overdue-loans - BM7.2: Báo cáo sách trả trễ', () => {
    it('should get overdue loans report', () => {
      return request(app.getHttpServer())
        .get('/api/reports/overdue-loans')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          if (res.body.length > 0) {
            expect(res.body[0]).toHaveProperty('readerName');
            expect(res.body[0]).toHaveProperty('bookTitle');
            expect(res.body[0]).toHaveProperty('borrowDate');
            expect(res.body[0]).toHaveProperty('overdueDays');
          }
        });
    });

    it('should filter by date range', () => {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
      const endDate = new Date();

      return request(app.getHttpServer())
        .get(
          `/api/reports/overdue-loans?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        )
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('GET /api/reports/reader-statistics', () => {
    it('should get reader statistics', () => {
      return request(app.getHttpServer())
        .get('/api/reports/reader-statistics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          if (res.body.length > 0) {
            expect(res.body[0]).toHaveProperty('readerName');
            expect(res.body[0]).toHaveProperty('borrowCount');
          }
        });
    });
  });

  describe('GET /api/reports/fine-statistics', () => {
    it('should get fine collection statistics', () => {
      return request(app.getHttpServer())
        .get('/api/reports/fine-statistics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('totalAmount');
          expect(res.body).toHaveProperty('paymentCount');
          expect(typeof res.body.totalAmount).toBe('number');
          expect(typeof res.body.paymentCount).toBe('number');
        });
    });

    it('should filter by date range', () => {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
      const endDate = new Date();

      return request(app.getHttpServer())
        .get(
          `/api/reports/fine-statistics?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        )
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('totalAmount');
          expect(res.body).toHaveProperty('paymentCount');
        });
    });
  });

  describe('GET /api/reports/books-distribution', () => {
    it('should get books distribution by category', () => {
      return request(app.getHttpServer())
        .get('/api/reports/books-distribution')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          if (res.body.length > 0) {
            expect(res.body[0]).toHaveProperty('categoryName');
            expect(res.body[0]).toHaveProperty('titleCount');
          }
        });
    });
  });

  describe('GET /api/reports/trend', () => {
    it('should get borrowing trend statistics', () => {
      return request(app.getHttpServer())
        .get('/api/reports/trend')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('should accept custom months parameter', () => {
      return request(app.getHttpServer())
        .get('/api/reports/trend?months=6')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });
});
