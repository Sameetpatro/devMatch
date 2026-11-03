const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/prisma');

describe('Concurrency & Race Condition Regression Tests', () => {
  jest.setTimeout(45000);

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('Concurrent burst applications result in exactly 1 application record (Idempotency)', async () => {
    const timestamp = Date.now();

    // 1. Create Recruiter & Role
    const recRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: `jest_rec_${timestamp}@test.com`,
        password: 'password123',
        name: 'Jest Recruiter',
        role: 'Tech Lead',
        userType: 'RECRUITER',
        phone: '+1 555-8888',
      });
    const recruiterToken = recRes.body.token;

    const roleRes = await request(app)
      .post('/api/roles')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({
        title: 'Concurrency Engineer',
        companyName: 'Test Inc',
        description: 'Test concurrent applications.',
        skills: ['PostgreSQL'],
      });
    const roleId = roleRes.body.data.id;

    // 2. Create Developer
    const devRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: `jest_dev_${timestamp}@test.com`,
        password: 'password123',
        name: 'Jest Developer',
        role: 'Backend Dev',
        userType: 'DEVELOPER',
        phone: '+1 555-9999',
        skills: ['PostgreSQL'],
      });
    const devToken = devRes.body.token;
    const devId = devRes.body.user.id;

    // 3. Fire 6 concurrent applications at once
    const requests = Array.from({ length: 6 }).map(() =>
      request(app)
        .post(`/api/roles/${roleId}/apply`)
        .set('Authorization', `Bearer ${devToken}`)
        .send({ coverLetter: 'Concurrent test submission' })
    );

    const responses = await Promise.all(requests);

    // Either 201 (Created) or 409 (Conflict from unique constraint collision) are safe responses
    responses.forEach((res) => {
      expect([200, 201, 409]).toContain(res.status);
    });

    // Database check: verify composite uniqueness constraint maintained exactly 1 row
    const dbApplications = await prisma.application.findMany({
      where: { jobRoleId: roleId, developerId: devId },
    });
    expect(dbApplications.length).toBe(1);
  });

  test('Simultaneous mutual swiping creates exactly 1 canonical Match row', async () => {
    const timestamp = Date.now() + 2;

    const user1Res = await request(app)
      .post('/api/auth/register')
      .send({
        email: `swipe1_${timestamp}@test.com`,
        password: 'password123',
        name: 'Swipe User 1',
        role: 'Developer 1',
        phone: '+1 555-1111',
      });
    const token1 = user1Res.body.token;
    const user1Id = user1Res.body.user.id;

    const user2Res = await request(app)
      .post('/api/auth/register')
      .send({
        email: `swipe2_${timestamp}@test.com`,
        password: 'password123',
        name: 'Swipe User 2',
        role: 'Developer 2',
        phone: '+1 555-2222',
      });
    const token2 = user2Res.body.token;
    const user2Id = user2Res.body.user.id;

    // Fire simultaneous mutual cross-swipes
    const [res1, res2] = await Promise.all([
      request(app)
        .post('/api/swipes')
        .set('Authorization', `Bearer ${token1}`)
        .send({ toUserId: user2Id, direction: 'LIKE' }),
      request(app)
        .post('/api/swipes')
        .set('Authorization', `Bearer ${token2}`)
        .send({ toUserId: user1Id, direction: 'LIKE' }),
    ]);

    expect([200, 201]).toContain(res1.status);
    expect([200, 201]).toContain(res2.status);

    // Database check: exactly 1 match row between user1 and user2
    const minId = Math.min(user1Id, user2Id);
    const maxId = Math.max(user1Id, user2Id);

    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { userAId: minId, userBId: maxId },
          { userAId: maxId, userBId: minId },
        ],
      },
    });

    expect(matches.length).toBe(1);
    expect(matches[0].userAId).toBe(minId);
    expect(matches[0].userBId).toBe(maxId);
  });
});
