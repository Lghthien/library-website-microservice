import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Parameters - QĐ8 (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let librarianToken: string;
  let parameterId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    // Login as admin
    const adminLoginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'admin@library.com',
        password: 'admin123',
      });
    adminToken = adminLoginRes.body.access_token;

    // Login as librarian
    const librarianLoginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'librarian@library.com',
        password: 'admin123',
      });
    librarianToken = librarianLoginRes.body.access_token;

    // Get a parameter ID
    const paramsRes = await request(app.getHttpServer())
      .get('/api/parameters')
      .set('Authorization', `Bearer ${adminToken}`);
    parameterId = paramsRes.body[0]._id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/parameters', () => {
    it('should get all parameters', () => {
      return request(app.getHttpServer())
        .get('/api/parameters')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);

          // Check for required parameters (QĐ1-QĐ8)
          const paramNames = res.body.map((p) => p.paramName);
          expect(paramNames).toContain('QD1_MIN_AGE');
          expect(paramNames).toContain('QD1_MAX_AGE');
          expect(paramNames).toContain('QD8_CARD_VALIDITY_MONTHS');
          expect(paramNames).toContain('QD8_PUBLICATION_YEAR_GAP');
          expect(paramNames).toContain('QD8_MAX_BOOKS_PER_LOAN');
          expect(paramNames).toContain('QD8_MAX_BORROW_DAYS');
          expect(paramNames).toContain('QD8_FINE_PER_DAY');
        });
    });

    it('should allow librarian to view parameters', () => {
      return request(app.getHttpServer())
        .get('/api/parameters')
        .set('Authorization', `Bearer ${librarianToken}`)
        .expect(200);
    });
  });

  describe('GET /api/parameters/name/:paramName', () => {
    it('should get parameter by name', () => {
      return request(app.getHttpServer())
        .get('/api/parameters/name/QD1_MIN_AGE')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.paramName).toBe('QD1_MIN_AGE');
          expect(res.body).toHaveProperty('paramValue');
          expect(res.body).toHaveProperty('description');
        });
    });

    it('should return 404 for non-existent parameter', () => {
      return request(app.getHttpServer())
        .get('/api/parameters/name/NON_EXISTENT_PARAM')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('PATCH /api/parameters/:id - QĐ8: Thay đổi quy định', () => {
    it('should allow admin to update parameter', async () => {
      // Get current value
      const currentRes = await request(app.getHttpServer())
        .get(`/api/parameters/${parameterId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      const currentValue = currentRes.body.paramValue;
      const newValue = String(parseInt(currentValue) + 1);

      return request(app.getHttpServer())
        .patch(`/api/parameters/${parameterId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          paramValue: newValue,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.paramValue).toBe(newValue);
        });
    });

    it('should forbid librarian from updating parameter', () => {
      return request(app.getHttpServer())
        .patch(`/api/parameters/${parameterId}`)
        .set('Authorization', `Bearer ${librarianToken}`)
        .send({
          paramValue: '999',
        })
        .expect(403);
    });
  });

  describe('PATCH /api/parameters/name/:paramName - QĐ8: Thay đổi quy định', () => {
    it('should update QD1_MIN_AGE (QĐ8)', () => {
      return request(app.getHttpServer())
        .patch('/api/parameters/name/QD1_MIN_AGE')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          paramValue: '18',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.paramName).toBe('QD1_MIN_AGE');
          expect(res.body.paramValue).toBe('18');
        });
    });

    it('should update QD1_MAX_AGE (QĐ8)', () => {
      return request(app.getHttpServer())
        .patch('/api/parameters/name/QD1_MAX_AGE')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          paramValue: '55',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.paramName).toBe('QD1_MAX_AGE');
          expect(res.body.paramValue).toBe('55');
        });
    });

    it('should update QD8_CARD_VALIDITY_MONTHS (QĐ8)', () => {
      return request(app.getHttpServer())
        .patch('/api/parameters/name/QD8_CARD_VALIDITY_MONTHS')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          paramValue: '6',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.paramName).toBe('QD8_CARD_VALIDITY_MONTHS');
          expect(res.body.paramValue).toBe('6');
        });
    });

    it('should update QD8_PUBLICATION_YEAR_GAP (QĐ8)', () => {
      return request(app.getHttpServer())
        .patch('/api/parameters/name/QD8_PUBLICATION_YEAR_GAP')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          paramValue: '8',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.paramName).toBe('QD8_PUBLICATION_YEAR_GAP');
          expect(res.body.paramValue).toBe('8');
        });
    });

    it('should update QD8_MAX_BOOKS_PER_LOAN (QĐ8)', () => {
      return request(app.getHttpServer())
        .patch('/api/parameters/name/QD8_MAX_BOOKS_PER_LOAN')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          paramValue: '5',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.paramName).toBe('QD8_MAX_BOOKS_PER_LOAN');
          expect(res.body.paramValue).toBe('5');
        });
    });

    it('should update QD8_MAX_BORROW_DAYS (QĐ8)', () => {
      return request(app.getHttpServer())
        .patch('/api/parameters/name/QD8_MAX_BORROW_DAYS')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          paramValue: '4',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.paramName).toBe('QD8_MAX_BORROW_DAYS');
          expect(res.body.paramValue).toBe('4');
        });
    });

    it('should update QD8_FINE_PER_DAY (QĐ8)', () => {
      return request(app.getHttpServer())
        .patch('/api/parameters/name/QD8_FINE_PER_DAY')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          paramValue: '1000',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.paramName).toBe('QD8_FINE_PER_DAY');
          expect(res.body.paramValue).toBe('1000');
        });
    });

    it('should forbid librarian from updating parameters', () => {
      return request(app.getHttpServer())
        .patch('/api/parameters/name/QD1_MIN_AGE')
        .set('Authorization', `Bearer ${librarianToken}`)
        .send({
          paramValue: '20',
        })
        .expect(403);
    });
  });

  describe('POST /api/parameters', () => {
    it('should allow admin to create new parameter', () => {
      return request(app.getHttpServer())
        .post('/api/parameters')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          paramName: `TEST_PARAM_${Date.now()}`,
          paramValue: '100',
          description: 'Test parameter',
          dataType: 'number',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('_id');
          expect(res.body).toHaveProperty('paramName');
        });
    });

    it('should forbid librarian from creating parameter', () => {
      return request(app.getHttpServer())
        .post('/api/parameters')
        .set('Authorization', `Bearer ${librarianToken}`)
        .send({
          paramName: 'TEST_PARAM',
          paramValue: '100',
          description: 'Test',
          dataType: 'number',
        })
        .expect(403);
    });
  });
});
