import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Fine Receipts - BM6 (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let readerWithDebtId: string;
  let createdReceiptId: string;

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

    // Get reader with debt
    const readersRes = await request(app.getHttpServer())
      .get('/api/readers/with-debt')
      .set('Authorization', `Bearer ${authToken}`);

    if (readersRes.body.length > 0) {
      readerWithDebtId = readersRes.body[0]._id;
    } else {
      // If no reader with debt, get any reader
      const allReadersRes = await request(app.getHttpServer())
        .get('/api/readers')
        .set('Authorization', `Bearer ${authToken}`);
      readerWithDebtId = allReadersRes.body[0]._id;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/fine-receipts', () => {
    it('should get all fine receipts', () => {
      return request(app.getHttpServer())
        .get('/api/fine-receipts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer()).get('/api/fine-receipts').expect(401);
    });
  });

  describe('POST /api/fine-receipts - BM6: Lập phiếu thu tiền phạt (QĐ6)', () => {
    it('should create fine receipt with valid data', async () => {
      // Get reader's current debt
      const readerRes = await request(app.getHttpServer())
        .get(`/api/readers/${readerWithDebtId}`)
        .set('Authorization', `Bearer ${authToken}`);

      const totalDebt = readerRes.body.totalDebt || 0;
      const amountPaid = totalDebt > 0 ? Math.min(totalDebt, 10000) : 5000;

      return request(app.getHttpServer())
        .post('/api/fine-receipts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          readerId: readerWithDebtId,
          amountPaid: amountPaid,
          paymentDate: new Date().toISOString(),
          notes: 'Test payment',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('_id');
          expect(res.body).toHaveProperty('code');
          expect(res.body.code).toMatch(/^PT\d{4}$/);
          expect(res.body.amountPaid).toBe(amountPaid);
          createdReceiptId = res.body._id;
        });
    });

    it('should fail with amount > reader debt (QĐ6)', async () => {
      const readerRes = await request(app.getHttpServer())
        .get(`/api/readers/${readerWithDebtId}`)
        .set('Authorization', `Bearer ${authToken}`);

      const totalDebt = readerRes.body.totalDebt || 0;
      const excessAmount = totalDebt + 100000;

      return request(app.getHttpServer())
        .post('/api/fine-receipts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          readerId: readerWithDebtId,
          amountPaid: excessAmount,
          paymentDate: new Date().toISOString(),
        })
        .expect(400);
    });

    it('should fail with negative amount', () => {
      return request(app.getHttpServer())
        .post('/api/fine-receipts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          readerId: readerWithDebtId,
          amountPaid: -1000,
          paymentDate: new Date().toISOString(),
        })
        .expect(400);
    });

    it('should fail with missing required fields', () => {
      return request(app.getHttpServer())
        .post('/api/fine-receipts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          readerId: readerWithDebtId,
        })
        .expect(400);
    });
  });

  describe('GET /api/fine-receipts/reader/:readerId', () => {
    it('should get fine receipts by reader', () => {
      return request(app.getHttpServer())
        .get(`/api/fine-receipts/reader/${readerWithDebtId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('GET /api/fine-receipts/search', () => {
    it('should search fine receipts by date range', () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const endDate = new Date();

      return request(app.getHttpServer())
        .get(
          `/api/fine-receipts/search?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        )
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('GET /api/fine-receipts/unpaid', () => {
    it('should get unpaid fine receipts', () => {
      return request(app.getHttpServer())
        .get('/api/fine-receipts/unpaid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('GET /api/fine-receipts/:id', () => {
    it('should get fine receipt by ID', () => {
      return request(app.getHttpServer())
        .get(`/api/fine-receipts/${createdReceiptId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body._id).toBe(createdReceiptId);
          expect(res.body).toHaveProperty('code');
        });
    });
  });

  describe('PATCH /api/fine-receipts/:id/pay', () => {
    it('should mark receipt as paid', () => {
      return request(app.getHttpServer())
        .patch(`/api/fine-receipts/${createdReceiptId}/pay`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          paymentDate: new Date().toISOString(),
          notes: 'Paid in full',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('paid');
        });
    });
  });
});
