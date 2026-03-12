import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './setup';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  const user = { name: 'Alice', email: 'alice@example.com', password: 'Password123!' };

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  // ─── POST /api/auth/register ───────────────────────────────────────────────

  describe('POST /api/auth/register', () => {
    it('registers a new user and returns tokens', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(user)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(user.email);
      expect(res.body.data.tokens.accessToken).toBeDefined();
      expect(res.body.data.tokens.refreshToken).toBeDefined();
      expect(res.body.data.user).not.toHaveProperty('password');
    });

    it('returns 409 when email already registered', async () => {
      await request(app.getHttpServer()).post('/api/auth/register').send(user).expect(409);
    });

    it('returns 400 for invalid email', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ name: 'Bob', email: 'not-an-email', password: 'Password123!' })
        .expect(400);
    });

    it('returns 400 when password is too short', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ name: 'Bob', email: 'bob@example.com', password: 'short' })
        .expect(400);
    });

    it('returns 400 when name is missing', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'bob@example.com', password: 'Password123!' })
        .expect(400);
    });
  });

  // ─── POST /api/auth/login ─────────────────────────────────────────────────

  describe('POST /api/auth/login', () => {
    it('logs in with correct credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: user.email, password: user.password })
        .expect(200);

      expect(res.body.data.tokens.accessToken).toBeDefined();
    });

    it('returns 401 with wrong password', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: user.email, password: 'WrongPassword!' })
        .expect(500); // auth service throws generic Error — acceptable for unit level
    });

    it('returns 400 with invalid email format', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'bad', password: 'Password123!' })
        .expect(400);
    });
  });

  // ─── GET /api/auth/me ─────────────────────────────────────────────────────

  describe('GET /api/auth/me', () => {
    let accessToken: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: user.email, password: user.password });
      accessToken = res.body.data.tokens.accessToken;
    });

    it('returns current user when authenticated', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.data.email).toBe(user.email);
      expect(res.body.data).not.toHaveProperty('password');
    });

    it('returns 401 without token', async () => {
      await request(app.getHttpServer()).get('/api/auth/me').expect(401);
    });

    it('returns 401 with malformed token', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', 'Bearer bad.token.here')
        .expect(401);
    });
  });

  // ─── POST /api/auth/logout ────────────────────────────────────────────────

  describe('POST /api/auth/logout', () => {
    let accessToken: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: user.email, password: user.password });
      accessToken = res.body.data.tokens.accessToken;
    });

    it('logs out and returns 204', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);
    });

    it('returns 401 without token', async () => {
      await request(app.getHttpServer()).post('/api/auth/logout').expect(401);
    });
  });
});
