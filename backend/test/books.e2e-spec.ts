import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Books - BM2/BM3 (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let titleId: string;
  let categoryId: string;
  let createdBookId: string;

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

    // Get category
    const categoriesRes = await request(app.getHttpServer())
      .get('/api/categories')
      .set('Authorization', `Bearer ${authToken}`);
    categoryId = categoriesRes.body[0]._id;

    // Get or create title
    const titlesRes = await request(app.getHttpServer())
      .get('/api/title-books')
      .set('Authorization', `Bearer ${authToken}`);
    titleId = titlesRes.body[0]._id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/books - BM3: Tra cứu sách', () => {
    it('should get all books', () => {
      return request(app.getHttpServer())
        .get('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer()).get('/api/books').expect(401);
    });
  });

  describe('POST /api/books - BM2: Tiếp nhận sách mới', () => {
    it('should create new book with valid data (QĐ2)', () => {
      const currentYear = new Date().getFullYear();
      const publishYear = currentYear - 2; // Within 8 years

      return request(app.getHttpServer())
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          titleId: titleId,
          publisher: 'NXB Test',
          publishYear: publishYear,
          importDate: new Date().toISOString(),
          price: 100000,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('_id');
          expect(res.body.publisher).toBe('NXB Test');
          expect(res.body.publishYear).toBe(publishYear);
          expect(res.body.price).toBe(100000);
          createdBookId = res.body._id;
        });
    });

    it('should fail with publish year > 8 years ago (QĐ2)', () => {
      const currentYear = new Date().getFullYear();
      const oldYear = currentYear - 10; // More than 8 years

      return request(app.getHttpServer())
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          titleId: titleId,
          publisher: 'NXB Test',
          publishYear: oldYear,
          importDate: new Date().toISOString(),
          price: 100000,
        })
        .expect(400);
    });

    it('should fail with future publish year (QĐ2)', () => {
      const currentYear = new Date().getFullYear();
      const futureYear = currentYear + 2;

      return request(app.getHttpServer())
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          titleId: titleId,
          publisher: 'NXB Test',
          publishYear: futureYear,
          importDate: new Date().toISOString(),
          price: 100000,
        })
        .expect(400);
    });

    it('should fail with negative price', () => {
      const currentYear = new Date().getFullYear();

      return request(app.getHttpServer())
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          titleId: titleId,
          publisher: 'NXB Test',
          publishYear: currentYear,
          importDate: new Date().toISOString(),
          price: -1000,
        })
        .expect(400);
    });

    it('should fail with price > 100,000,000', () => {
      const currentYear = new Date().getFullYear();

      return request(app.getHttpServer())
        .post('/api/books')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          titleId: titleId,
          publisher: 'NXB Test',
          publishYear: currentYear,
          importDate: new Date().toISOString(),
          price: 150000000,
        })
        .expect(400);
    });
  });

  describe('GET /api/books/search', () => {
    it('should search books by keyword', () => {
      return request(app.getHttpServer())
        .get('/api/books/search?keyword=Test')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('should search books by category', () => {
      return request(app.getHttpServer())
        .get(`/api/books/search?categoryId=${categoryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('GET /api/books/advanced-search', () => {
    it('should search with multiple filters', () => {
      const currentYear = new Date().getFullYear();

      return request(app.getHttpServer())
        .get(
          `/api/books/advanced-search?minYear=${currentYear - 5}&maxYear=${currentYear}`,
        )
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('GET /api/books/by-availability', () => {
    it('should get available books', () => {
      return request(app.getHttpServer())
        .get('/api/books/by-availability?available=true')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('GET /api/books/recently-added', () => {
    it('should get recently added books', () => {
      return request(app.getHttpServer())
        .get('/api/books/recently-added?limit=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeLessThanOrEqual(5);
        });
    });
  });

  describe('GET /api/books/:id', () => {
    it('should get book by ID', () => {
      return request(app.getHttpServer())
        .get(`/api/books/${createdBookId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body._id).toBe(createdBookId);
        });
    });
  });

  describe('PATCH /api/books/:id', () => {
    it('should update book information', () => {
      return request(app.getHttpServer())
        .patch(`/api/books/${createdBookId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          price: 120000,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.price).toBe(120000);
        });
    });
  });

  describe('DELETE /api/books/:id', () => {
    it('should delete book', () => {
      return request(app.getHttpServer())
        .delete(`/api/books/${createdBookId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });
});
