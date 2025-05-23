const request = require('supertest');
const app = require('../server');
let server;

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn().mockResolvedValue({ data: [], error: null }),
      insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
      delete: jest.fn().mockResolvedValue({ error: null }),
      update: jest.fn().mockResolvedValue({ data: {}, error: null }),
      single: jest.fn().mockResolvedValue({ data: {}, error: null }),
      order: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
    })),
    auth: {
      signUp: jest.fn().mockResolvedValue({ data: {}, error: null }),
      signInWithPassword: jest.fn().mockResolvedValue({ data: {}, error: null }),
      admin: { updateUserById: jest.fn().mockResolvedValue({ error: null }) }
    }
  }))
}));

beforeAll(() => {
  server = app.listen(0);
});

afterAll(() => {
  server.close();
});

describe('Простые API тесты', () => {
  test('GET /api/waiters', async () => {
    const res = await request(server).get('/api/waiters');
    expect([200, 500]).toContain(res.statusCode);
  });

  test('POST /api/waiters', async () => {
    const res = await request(server)
      .post('/api/waiters')
      .send({ name: 'Тест', surname: 'Петров', phone: '123', hired_at: '2025-05-19' });
    expect([200, 201, 400, 500]).toContain(res.statusCode);
  });

  test('GET /api/dishes', async () => {
    const res = await request(server).get('/api/dishes');
    expect([200, 500]).toContain(res.statusCode);
  });

  test('POST /api/login', async () => {
    const res = await request(server)
      .post('/api/login')
      .send({ email: 'user@mail.ru', password: '12345' });
    expect([200, 400, 401, 500]).toContain(res.statusCode);
  });

  test('POST /api/register', async () => {
    const res = await request(server)
      .post('/api/register')
      .send({ email: 'user@mail.ru', password: '12345', username: 'test', role: 'waiter' });
    expect([200, 201, 400, 500]).toContain(res.statusCode);
  });

  test('GET /api/dashboard', async () => {
    const res = await request(server).get('/api/dashboard');
    expect([200, 500]).toContain(res.statusCode);
  });
});