import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Authentication (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/auth/login (POST)', () => {
    it('should login successfully with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'admin@library.com',
          password: 'admin123',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user.email).toBe('admin@library.com');
          expect(res.body.user.role).toBe('ADMIN');
          authToken = res.body.access_token;
        });
    });

    it('should fail with invalid email', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'wrong@library.com',
          password: 'admin123',
        })
        .expect(401);
    });

    it('should fail with invalid password', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'admin@library.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('should fail with missing credentials', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({})
        .expect(400);
    });
  });

  describe('/api/auth/profile (GET)', () => {
    it('should get user profile with valid token', async () => {
      // Login first
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'admin@library.com',
          password: 'admin123',
        });

      const token = loginRes.body.access_token;

      return request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.email).toBe('admin@library.com');
          expect(res.body.role).toBe('ADMIN');
        });
    });

    it('should fail without token', () => {
      return request(app.getHttpServer()).get('/api/auth/profile').expect(401);
    });

    it('should fail with invalid token', () => {
      return request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('/api/auth/register (POST)', () => {
    let adminToken: string;

    beforeAll(async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'admin@library.com',
          password: 'admin123',
        });
      adminToken = loginRes.body.access_token;
    });

    it('should register new user as admin', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: `test${Date.now()}@library.com`,
          password: 'test123',
          fullName: 'Test User',
          phoneNumber: '0123456789',
          role: 'LIBRARIAN',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('_id');
          expect(res.body.email).toContain('@library.com');
          expect(res.body.role).toBe('LIBRARIAN');
        });
    });

    it('should fail to register with duplicate email', async () => {
      const email = `duplicate${Date.now()}@library.com`;

      // First registration
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email,
          password: 'test123',
          fullName: 'Test User',
          role: 'LIBRARIAN',
        });

      // Second registration with same email
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email,
          password: 'test123',
          fullName: 'Test User 2',
          role: 'LIBRARIAN',
        })
        .expect(400);
    });
  });
});
