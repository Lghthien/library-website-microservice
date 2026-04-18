import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Loans - BM4/BM5 (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let readerId: string;
  let copyId: string;
  let loanId: string;

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

    // Get reader
    const readersRes = await request(app.getHttpServer())
      .get('/api/readers')
      .set('Authorization', `Bearer ${authToken}`);
    readerId = readersRes.body[0]._id;

    // Get available book copy
    const copiesRes = await request(app.getHttpServer())
      .get('/api/book-copies')
      .set('Authorization', `Bearer ${authToken}`);
    const availableCopy = copiesRes.body.find((c) => c.status === 1);
    copyId = availableCopy._id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/loans/validate-borrow - BM4: Validate điều kiện mượn (QĐ4)', () => {
    it('should validate borrow successfully with valid conditions', () => {
      return request(app.getHttpServer())
        .post('/api/loans/validate-borrow')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          readerId: readerId,
          copyIds: [copyId],
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('canBorrow');
          expect(res.body).toHaveProperty('errors');
          expect(res.body).toHaveProperty('reader');
          expect(res.body.reader).toHaveProperty('fullName');
          expect(res.body.reader).toHaveProperty('maxBorrowLimit');
        });
    });

    it('should fail validation with non-existent reader', () => {
      return request(app.getHttpServer())
        .post('/api/loans/validate-borrow')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          readerId: '000000000000000000000000',
          copyIds: [copyId],
        })
        .expect(404);
    });

    it('should fail validation with empty copyIds', () => {
      return request(app.getHttpServer())
        .post('/api/loans/validate-borrow')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          readerId: readerId,
          copyIds: [],
        })
        .expect(400);
    });
  });

  describe('POST /api/loans - BM4: Cho mượn sách', () => {
    it('should create new loan', () => {
      return request(app.getHttpServer())
        .post('/api/loans')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          readerId: readerId,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('_id');
          expect(res.body).toHaveProperty('code');
          expect(res.body.code).toMatch(/^PM\d{4}$/);
          expect(res.body).toHaveProperty('borrowDate');
          loanId = res.body._id;
        });
    });
  });

  describe('POST /api/loan-details - Add book to loan', () => {
    it('should add book to loan', () => {
      return request(app.getHttpServer())
        .post('/api/loan-details')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          loanId: loanId,
          copyId: copyId,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('_id');
          expect(res.body.loanId).toBe(loanId);
          expect(res.body.copyId).toBe(copyId);
        });
    });
  });

  describe('POST /api/loans/:loanId/return-book - BM5: Trả sách (QĐ5)', () => {
    it('should return book and calculate fine', () => {
      return request(app.getHttpServer())
        .post(`/api/loans/${loanId}/return-book`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          copyId: copyId,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('success');
          expect(res.body.success).toBe(true);
          expect(res.body).toHaveProperty('loanDetail');
          expect(res.body.loanDetail).toHaveProperty('overdueDays');
          expect(res.body.loanDetail).toHaveProperty('fineAmount');
          expect(res.body).toHaveProperty('reader');
          expect(res.body.reader).toHaveProperty('totalDebt');
        });
    });

    it('should fail to return already returned book', () => {
      return request(app.getHttpServer())
        .post(`/api/loans/${loanId}/return-book`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          copyId: copyId,
        })
        .expect(400);
    });

    it('should fail with non-existent loan', () => {
      return request(app.getHttpServer())
        .post('/api/loans/000000000000000000000000/return-book')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          copyId: copyId,
        })
        .expect(404);
    });
  });

  describe('GET /api/loans', () => {
    it('should get all loans', () => {
      return request(app.getHttpServer())
        .get('/api/loans')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });
  });

  describe('GET /api/loans/reader/:readerId', () => {
    it('should get loans by reader', () => {
      return request(app.getHttpServer())
        .get(`/api/loans/reader/${readerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('GET /api/loans/overdue', () => {
    it('should get overdue loans', () => {
      return request(app.getHttpServer())
        .get('/api/loans/overdue')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('GET /api/loans/:id', () => {
    it('should get loan by ID', () => {
      return request(app.getHttpServer())
        .get(`/api/loans/${loanId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body._id).toBe(loanId);
          expect(res.body).toHaveProperty('code');
        });
    });
  });
});
