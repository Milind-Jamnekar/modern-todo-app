import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './setup';

describe('Todos (e2e)', () => {
  let app: INestApplication;

  // Two separate users to test ownership isolation
  const alice = { name: 'Alice', email: 'alice2@example.com', password: 'Password123!' };
  const bob = { name: 'Bob', email: 'bob2@example.com', password: 'Password123!' };

  let aliceToken: string;
  let bobToken: string;
  let todoId: string;

  const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` });

  beforeAll(async () => {
    app = await createTestApp();

    // Register and get tokens for both users
    const [aliceRes, bobRes] = await Promise.all([
      request(app.getHttpServer()).post('/api/auth/register').send(alice),
      request(app.getHttpServer()).post('/api/auth/register').send(bob),
    ]);

    aliceToken = aliceRes.body.data.tokens.accessToken;
    bobToken = bobRes.body.data.tokens.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  // ─── POST /api/todos ──────────────────────────────────────────────────────

  describe('POST /api/todos', () => {
    it('creates a todo for the authenticated user', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/todos')
        .set(authHeader(aliceToken))
        .send({ title: 'Buy groceries', priority: 'high' })
        .expect(201);

      expect(res.body.data.title).toBe('Buy groceries');
      expect(res.body.data.priority).toBe('high');
      expect(res.body.data.status).toBe('pending');
      expect(res.body.data.id).toBeDefined();
      todoId = res.body.data.id;
    });

    it('creates todo with optional fields', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/todos')
        .set(authHeader(aliceToken))
        .send({
          title: 'Write tests',
          description: 'Unit and e2e coverage',
          priority: 'medium',
          dueDate: '2026-12-31T00:00:00.000Z',
        })
        .expect(201);

      expect(res.body.data.description).toBe('Unit and e2e coverage');
      expect(res.body.data.dueDate).toBeDefined();
    });

    it('returns 400 when title is missing', async () => {
      await request(app.getHttpServer())
        .post('/api/todos')
        .set(authHeader(aliceToken))
        .send({ priority: 'low' })
        .expect(400);
    });

    it('returns 400 for invalid priority value', async () => {
      await request(app.getHttpServer())
        .post('/api/todos')
        .set(authHeader(aliceToken))
        .send({ title: 'Task', priority: 'extreme' })
        .expect(400);
    });

    it('returns 401 without auth token', async () => {
      await request(app.getHttpServer())
        .post('/api/todos')
        .send({ title: 'Unauthorized task' })
        .expect(401);
    });
  });

  // ─── GET /api/todos ───────────────────────────────────────────────────────

  describe('GET /api/todos', () => {
    it('returns paginated todos for authenticated user', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/todos')
        .set(authHeader(aliceToken))
        .expect(200);

      expect(res.body.data.data).toBeInstanceOf(Array);
      expect(res.body.data.total).toBeGreaterThan(0);
      expect(res.body.data.page).toBe(1);
    });

    it('does not return another user\'s todos', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/todos')
        .set(authHeader(bobToken))
        .expect(200);

      // Bob has no todos
      expect(res.body.data.total).toBe(0);
    });

    it('filters by status', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/todos?status=pending')
        .set(authHeader(aliceToken))
        .expect(200);

      expect(res.body.data.data.every((t: any) => t.status === 'pending')).toBe(true);
    });

    it('searches by title', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/todos?search=groceries')
        .set(authHeader(aliceToken))
        .expect(200);

      expect(res.body.data.data.length).toBeGreaterThan(0);
    });

    it('respects pagination params', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/todos?page=1&limit=1')
        .set(authHeader(aliceToken))
        .expect(200);

      expect(res.body.data.data.length).toBeLessThanOrEqual(1);
      expect(res.body.data.limit).toBe(1);
    });

    it('returns 401 without auth', async () => {
      await request(app.getHttpServer()).get('/api/todos').expect(401);
    });
  });

  // ─── GET /api/todos/stats ─────────────────────────────────────────────────

  describe('GET /api/todos/stats', () => {
    it('returns stats object with correct shape', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/todos/stats')
        .set(authHeader(aliceToken))
        .expect(200);

      expect(res.body.data).toMatchObject({
        total: expect.any(Number),
        pending: expect.any(Number),
        in_progress: expect.any(Number),
        completed: expect.any(Number),
      });
    });
  });

  // ─── GET /api/todos/:id ───────────────────────────────────────────────────

  describe('GET /api/todos/:id', () => {
    it('returns the todo for its owner', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/todos/${todoId}`)
        .set(authHeader(aliceToken))
        .expect(200);

      expect(res.body.data.id).toBe(todoId);
    });

    it('returns 403 when another user tries to access', async () => {
      await request(app.getHttpServer())
        .get(`/api/todos/${todoId}`)
        .set(authHeader(bobToken))
        .expect(403);
    });

    it('returns 404 for non-existent todo', async () => {
      await request(app.getHttpServer())
        .get('/api/todos/00000000-0000-0000-0000-000000000000')
        .set(authHeader(aliceToken))
        .expect(404);
    });

    it('returns 400 for invalid UUID', async () => {
      await request(app.getHttpServer())
        .get('/api/todos/not-a-uuid')
        .set(authHeader(aliceToken))
        .expect(400);
    });
  });

  // ─── PATCH /api/todos/:id ─────────────────────────────────────────────────

  describe('PATCH /api/todos/:id', () => {
    it('updates todo fields', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/todos/${todoId}`)
        .set(authHeader(aliceToken))
        .send({ title: 'Buy organic groceries', status: 'in_progress' })
        .expect(200);

      expect(res.body.data.title).toBe('Buy organic groceries');
      expect(res.body.data.status).toBe('in_progress');
    });

    it('allows partial updates (only status)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/todos/${todoId}`)
        .set(authHeader(aliceToken))
        .send({ status: 'completed' })
        .expect(200);

      expect(res.body.data.status).toBe('completed');
    });

    it('returns 403 when another user tries to update', async () => {
      await request(app.getHttpServer())
        .patch(`/api/todos/${todoId}`)
        .set(authHeader(bobToken))
        .send({ title: 'Hacked title' })
        .expect(403);
    });

    it('returns 400 for invalid status value', async () => {
      await request(app.getHttpServer())
        .patch(`/api/todos/${todoId}`)
        .set(authHeader(aliceToken))
        .send({ status: 'invalid-status' })
        .expect(400);
    });
  });

  // ─── DELETE /api/todos/:id ────────────────────────────────────────────────

  describe('DELETE /api/todos/:id', () => {
    it('returns 403 when another user tries to delete', async () => {
      await request(app.getHttpServer())
        .delete(`/api/todos/${todoId}`)
        .set(authHeader(bobToken))
        .expect(403);
    });

    it('deletes the todo and returns 204', async () => {
      await request(app.getHttpServer())
        .delete(`/api/todos/${todoId}`)
        .set(authHeader(aliceToken))
        .expect(204);
    });

    it('returns 404 after deletion', async () => {
      await request(app.getHttpServer())
        .get(`/api/todos/${todoId}`)
        .set(authHeader(aliceToken))
        .expect(404);
    });
  });
});
